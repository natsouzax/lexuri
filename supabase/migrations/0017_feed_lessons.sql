-- Cache de transcrições e chunks para feed items
-- Transcript: uma entrada por feed_item (igual para todos os usuários)
-- Chunks: uma entrada por (feed_item, level, native_lang) — shared entre usuários com mesmo nível/idioma

CREATE TABLE IF NOT EXISTS feed_lessons (
  feed_item_id text        NOT NULL REFERENCES feed_items(id) ON DELETE CASCADE,
  transcript   text        NOT NULL,
  segments     jsonb       NOT NULL DEFAULT '[]',
  built_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY  (feed_item_id)
);

CREATE TABLE IF NOT EXISTS feed_lesson_chunks (
  feed_item_id  text        NOT NULL REFERENCES feed_items(id) ON DELETE CASCADE,
  level         text        NOT NULL,
  native_lang   text        NOT NULL DEFAULT 'Portuguese',
  chunks        jsonb       NOT NULL DEFAULT '[]',
  original_text text        NOT NULL DEFAULT '',
  built_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY   (feed_item_id, level, native_lang)
);

ALTER TABLE feed_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_lesson_chunks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'feed_lessons' AND policyname = 'authenticated reads feed_lessons') THEN
    EXECUTE 'CREATE POLICY "authenticated reads feed_lessons" ON feed_lessons FOR SELECT USING (auth.role() = ''authenticated'')';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'feed_lessons' AND policyname = 'service manages feed_lessons') THEN
    EXECUTE 'CREATE POLICY "service manages feed_lessons" ON feed_lessons FOR ALL USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'feed_lesson_chunks' AND policyname = 'authenticated reads feed_lesson_chunks') THEN
    EXECUTE 'CREATE POLICY "authenticated reads feed_lesson_chunks" ON feed_lesson_chunks FOR SELECT USING (auth.role() = ''authenticated'')';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'feed_lesson_chunks' AND policyname = 'service manages feed_lesson_chunks') THEN
    EXECUTE 'CREATE POLICY "service manages feed_lesson_chunks" ON feed_lesson_chunks FOR ALL USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')';
  END IF;
END $$;
