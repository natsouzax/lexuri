-- Remove level differentiation from chunk cache.
-- Chunks are now universal per feed item + native language.
-- The AI detects ALL chunks (all CEFR levels) in a single pass.

DROP TABLE IF EXISTS feed_lesson_chunks;

CREATE TABLE feed_lesson_chunks (
  feed_item_id  text        NOT NULL REFERENCES feed_items(id) ON DELETE CASCADE,
  native_lang   text        NOT NULL DEFAULT 'Portuguese',
  chunks        jsonb       NOT NULL DEFAULT '[]',
  original_text text        NOT NULL DEFAULT '',
  built_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY   (feed_item_id, native_lang)
);

ALTER TABLE feed_lesson_chunks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'feed_lesson_chunks' AND policyname = 'authenticated reads feed_lesson_chunks') THEN
    EXECUTE 'CREATE POLICY "authenticated reads feed_lesson_chunks" ON feed_lesson_chunks FOR SELECT USING (auth.role() = ''authenticated'')';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'feed_lesson_chunks' AND policyname = 'service manages feed_lesson_chunks') THEN
    EXECUTE 'CREATE POLICY "service manages feed_lesson_chunks" ON feed_lesson_chunks FOR ALL USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')';
  END IF;
END $$;
