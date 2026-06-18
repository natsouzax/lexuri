-- Cache de transcrições do YouTube por video_id (compartilhado entre todos os usuários)
-- Evita re-buscar o YouTube para vídeos já processados — especialmente útil quando a cota
-- do Supadata está esgotada ou o IP do Vercel está bloqueado pelo YouTube.
-- TTL de 90 dias (controlado pela aplicação no select com filtro fetched_at).

CREATE TABLE IF NOT EXISTS youtube_transcript_cache (
  video_id    text        PRIMARY KEY,
  transcript  text        NOT NULL,
  segments    jsonb       NOT NULL DEFAULT '[]',
  fetched_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE youtube_transcript_cache ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'youtube_transcript_cache' AND policyname = 'authenticated reads transcript cache'
  ) THEN
    EXECUTE 'CREATE POLICY "authenticated reads transcript cache" ON youtube_transcript_cache FOR SELECT USING (auth.role() = ''authenticated'')';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'youtube_transcript_cache' AND policyname = 'service manages transcript cache'
  ) THEN
    EXECUTE 'CREATE POLICY "service manages transcript cache" ON youtube_transcript_cache FOR ALL USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')';
  END IF;
END $$;
