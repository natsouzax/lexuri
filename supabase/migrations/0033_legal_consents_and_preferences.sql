-- ============================================================
-- 0033: Auditable legal consent and account preferences
-- ============================================================

alter table profiles
  add column if not exists marketing_consent boolean not null default false,
  add column if not exists marketing_consent_updated_at timestamptz;

create table if not exists legal_consents (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users on delete cascade,
  document_type    text        not null check (document_type in ('terms', 'privacy')),
  document_version text        not null check (char_length(document_version) between 1 and 50),
  accepted_at      timestamptz not null default now(),
  unique (user_id, document_type, document_version)
);

create index if not exists legal_consents_user_idx
  on legal_consents (user_id, accepted_at desc);

alter table legal_consents enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'legal_consents' and policyname = 'users read own legal consents'
  ) then
    execute 'create policy "users read own legal consents" on legal_consents for select
      using (auth.uid() = user_id)';
  end if;
end $$;

-- The database timestamp is authoritative. Registration metadata only says
-- which version was displayed and whether each required checkbox was checked.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  consent_version text := left(coalesce(nullif(new.raw_user_meta_data->>'legal_version', ''), 'unknown'), 50);
  accepted_at timestamptz := now();
  accepts_marketing boolean := coalesce(new.raw_user_meta_data->>'marketing_consent', 'false') = 'true';
begin
  insert into profiles (
    id,
    full_name,
    avatar_url,
    email_verified,
    marketing_consent,
    marketing_consent_updated_at
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'avatar_url',
    new.email_confirmed_at is not null,
    accepts_marketing,
    accepted_at
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    email_verified = excluded.email_verified,
    marketing_consent = excluded.marketing_consent,
    marketing_consent_updated_at = excluded.marketing_consent_updated_at,
    updated_at = now();

  if coalesce(new.raw_user_meta_data->>'terms_accepted', 'false') = 'true' then
    insert into legal_consents (user_id, document_type, document_version, accepted_at)
    values (new.id, 'terms', consent_version, accepted_at)
    on conflict do nothing;
  end if;

  if coalesce(new.raw_user_meta_data->>'privacy_accepted', 'false') = 'true' then
    insert into legal_consents (user_id, document_type, document_version, accepted_at)
    values (new.id, 'privacy', consent_version, accepted_at)
    on conflict do nothing;
  end if;

  return new;
end;
$$;
