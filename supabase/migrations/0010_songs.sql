create table if not exists songs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  artist       text not null,
  spotify_url  text,
  youtube_url  text,
  lrc_content  text,
  plain_lyrics text not null default '',
  chunks_count integer not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists songs_user_id_idx on songs (user_id);
create index if not exists songs_user_created_idx on songs (user_id, created_at desc);

alter table songs enable row level security;

create policy "users manage own songs"
  on songs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
