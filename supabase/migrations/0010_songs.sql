CREATE TABLE IF NOT EXISTS songs (
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

CREATE INDEX IF NOT EXISTS songs_user_id_idx      ON songs (user_id);
CREATE INDEX IF NOT EXISTS songs_user_created_idx ON songs (user_id, created_at DESC);

ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'songs' AND policyname = 'users manage own songs'
  ) THEN
    EXECUTE 'CREATE POLICY "users manage own songs"
      ON songs FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;
