-- Fix broken video IDs — switch to official lyric videos which have reliable English captions.
-- Also clears cached transcripts/chunks so fresh fetches use the new IDs.

-- ── Video ID fixes ────────────────────────────────────────────────────────────

-- Bruno Mars: official lyric video (10th anniversary, 2020) — fixes desync
UPDATE feed_items SET youtube_id = '6k8cpUkKK4c', maintenance = false
  WHERE id = 'music-count-on-me';

-- Taylor Swift: Taylor's Version lyric video (2023 official) — fixes sync/transition issue
UPDATE feed_items SET youtube_id = 'mvVBuG4IOW4', maintenance = false
  WHERE id = 'music-shake-it-off';

-- Katy Perry: official lyric video (2013 PRISM era) — fixes caption extraction failure
UPDATE feed_items SET youtube_id = 'e9SeJIgWRPk', maintenance = false
  WHERE id = 'music-roar';

-- Coldplay: lyric video — fixes malformed/incomplete caption issue
UPDATE feed_items SET youtube_id = 'SIelMFCVJLI', maintenance = false
  WHERE id = 'music-fix-you';

-- Queen Don't Stop Me Now: official lyric video — fixes non-English caption returns
UPDATE feed_items SET youtube_id = 'MHi9mKq0slA', maintenance = false
  WHERE id = 'music-dont-stop-me-now';

-- Queen Bohemian Rhapsody: official lyric video (2017) — fixes non-English caption returns
UPDATE feed_items SET youtube_id = 'jFKBR1ggTMY', maintenance = false
  WHERE id = 'music-bohemian-rhapsody';

-- Beatles: switch to remastered/lyric video versions — better caption availability
-- Keeping maintenance=true as a precaution (Beatles rights can still block captions)
UPDATE feed_items SET youtube_id = 'QDYfEBY9NM4'
  WHERE id = 'music-let-it-be';

UPDATE feed_items SET youtube_id = 'CG3jm4vvGXc'
  WHERE id = 'music-hey-jude';

UPDATE feed_items SET youtube_id = 'NrgmdOz227I'
  WHERE id = 'music-yesterday';

UPDATE feed_items SET youtube_id = 'huD8whbMRvU'
  WHERE id = 'music-come-together';

UPDATE feed_items SET youtube_id = 'YBcdt6DsLQA'
  WHERE id = 'music-in-my-life';

-- RHCP By the Way: correct the video ID (previous guess was wrong)
UPDATE feed_items SET youtube_id = 'JnfyjwChuNU'
  WHERE id = 'music-by-the-way';

-- ── Clear stale transcript/chunk caches for changed videos ───────────────────
-- These items either had bad/empty cached data or non-English transcripts.
-- Clearing forces a fresh fetch on next open using the new video IDs.

DELETE FROM feed_lesson_chunks WHERE feed_item_id IN (
  'music-count-on-me',
  'music-shake-it-off',
  'music-roar',
  'music-fix-you',
  'music-dont-stop-me-now',
  'music-bohemian-rhapsody',
  'music-let-it-be',
  'music-hey-jude',
  'music-yesterday',
  'music-come-together',
  'music-in-my-life',
  'music-by-the-way'
);

DELETE FROM feed_lessons WHERE feed_item_id IN (
  'music-count-on-me',
  'music-shake-it-off',
  'music-roar',
  'music-fix-you',
  'music-dont-stop-me-now',
  'music-bohemian-rhapsody',
  'music-let-it-be',
  'music-hey-jude',
  'music-yesterday',
  'music-come-together',
  'music-in-my-life',
  'music-by-the-way'
);
