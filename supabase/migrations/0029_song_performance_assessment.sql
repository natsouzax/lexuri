-- ============================================================
-- 0029: Whole-song performance assessment
-- Stores the latest AI intelligibility result for the complete song.
-- The assessment audio itself is never persisted here.
-- ============================================================

alter table user_songs
  add column if not exists performance_recognized_text text,
  add column if not exists performance_overall_scores jsonb,
  add column if not exists performance_word_scores jsonb,
  add column if not exists performance_section_results jsonb,
  add column if not exists performance_feedback text,
  add column if not exists performance_assessed_at timestamptz;

