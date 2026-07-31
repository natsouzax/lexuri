-- ============================================================
-- 0027: User Music Studio
-- 14 takeaways -> 6 verses + 1 chorus, pronunciation practice,
-- and a private final recording mixed in the browser.
-- ============================================================

create table if not exists user_songs (
  id                    uuid        primary key default gen_random_uuid(),
  user_id               uuid        not null references auth.users on delete cascade,
  title                 text        not null check (char_length(title) between 1 and 120),
  status                text        not null default 'ready'
                                    check (status in ('ready', 'practicing', 'completed')),
  locale                text        not null default 'en-US',
  bpm                   integer     not null default 88 check (bpm between 60 and 140),
  backing_track         text        not null default 'lexuri-lofi-v1',
  source_takeaway_ids   uuid[]      not null,
  source_fingerprint    text        not null,
  final_recording_path  text,
  final_recording_mime  text,
  consent_at            timestamptz,
  completed_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (user_id, source_fingerprint)
);

create index if not exists user_songs_user_created_idx
  on user_songs (user_id, created_at desc);

alter table user_songs enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'user_songs' and policyname = 'users manage own user songs') then
    execute 'create policy "users manage own user songs" on user_songs for all
      using (auth.uid() = user_id) with check (auth.uid() = user_id)';
  end if;
end $$;

create table if not exists user_song_sections (
  id                         uuid        primary key default gen_random_uuid(),
  song_id                    uuid        not null references user_songs on delete cascade,
  user_id                    uuid        not null references auth.users on delete cascade,
  section_order              integer     not null check (section_order between 0 and 6),
  section_type               text        not null check (section_type in ('verse', 'chorus')),
  label                      text        not null,
  lyrics                     text        not null check (char_length(lyrics) between 1 and 600),
  takeaway_ids               uuid[]      not null,
  best_pronunciation_score   numeric(5,2),
  last_practiced_at          timestamptz,
  created_at                 timestamptz not null default now(),
  unique (song_id, section_order)
);

create index if not exists user_song_sections_song_idx
  on user_song_sections (song_id, section_order);

alter table user_song_sections enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'user_song_sections' and policyname = 'users manage own song sections') then
    execute 'create policy "users manage own song sections" on user_song_sections for all
      using (auth.uid() = user_id) with check (auth.uid() = user_id)';
  end if;
end $$;

create table if not exists pronunciation_attempts (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users on delete cascade,
  song_id           uuid        not null references user_songs on delete cascade,
  section_id        uuid        not null references user_song_sections on delete cascade,
  reference_text    text        not null,
  recognized_text   text        not null default '',
  overall_scores    jsonb       not null default '{}',
  word_scores       jsonb       not null default '[]',
  feedback          text        not null default '',
  created_at        timestamptz not null default now()
);

create index if not exists pronunciation_attempts_section_idx
  on pronunciation_attempts (user_id, section_id, created_at desc);

alter table pronunciation_attempts enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'pronunciation_attempts' and policyname = 'users manage own pronunciation attempts') then
    execute 'create policy "users manage own pronunciation attempts" on pronunciation_attempts for all
      using (auth.uid() = user_id) with check (auth.uid() = user_id)';
  end if;
end $$;

-- The browser uploads only the user's final mix. The bucket stays private;
-- signed URLs are generated for playback in the Library.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'song-recordings',
  'song-recordings',
  false,
  15728640,
  array['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'objects' and schemaname = 'storage' and policyname = 'users read own song recordings') then
    execute 'create policy "users read own song recordings" on storage.objects for select
      using (bucket_id = ''song-recordings'' and (storage.foldername(name))[1] = auth.uid()::text)';
  end if;
  if not exists (select 1 from pg_policies where tablename = 'objects' and schemaname = 'storage' and policyname = 'users upload own song recordings') then
    execute 'create policy "users upload own song recordings" on storage.objects for insert
      with check (bucket_id = ''song-recordings'' and (storage.foldername(name))[1] = auth.uid()::text)';
  end if;
  if not exists (select 1 from pg_policies where tablename = 'objects' and schemaname = 'storage' and policyname = 'users update own song recordings') then
    execute 'create policy "users update own song recordings" on storage.objects for update
      using (bucket_id = ''song-recordings'' and (storage.foldername(name))[1] = auth.uid()::text)
      with check (bucket_id = ''song-recordings'' and (storage.foldername(name))[1] = auth.uid()::text)';
  end if;
  if not exists (select 1 from pg_policies where tablename = 'objects' and schemaname = 'storage' and policyname = 'users delete own song recordings') then
    execute 'create policy "users delete own song recordings" on storage.objects for delete
      using (bucket_id = ''song-recordings'' and (storage.foldername(name))[1] = auth.uid()::text)';
  end if;
end $$;
