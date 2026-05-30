-- User profiles (extends auth.users)
create table if not exists profiles (
  id            uuid primary key references auth.users on delete cascade,
  full_name     text not null default '',
  avatar_url    text,
  role          text not null default 'user' check (role in ('user', 'admin')),
  email_verified boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  last_login    timestamptz
);

alter table profiles enable row level security;

create policy "users read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "users update own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into profiles (id, full_name, avatar_url, email_verified)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'avatar_url',
    new.email_confirmed_at is not null
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Keep email_verified in sync
create or replace function sync_email_verified()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update profiles
  set email_verified = (new.email_confirmed_at is not null),
      updated_at = now()
  where id = new.id;
  return new;
end;
$$;

create or replace trigger on_auth_user_updated
  after update on auth.users
  for each row execute function sync_email_verified();

-- Onboarding preferences
create table if not exists onboarding (
  user_id         uuid primary key references auth.users on delete cascade,
  native_language text not null default 'Portuguese',
  current_level   text not null default 'A1'
                  check (current_level in ('A1','A2','B1','B2','C1','C2')),
  learning_goals  text[] not null default '{}',
  completed_at    timestamptz not null default now()
);

alter table onboarding enable row level security;

create policy "users manage own onboarding"
  on onboarding for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
