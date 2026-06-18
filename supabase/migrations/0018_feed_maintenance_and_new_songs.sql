-- Add maintenance flag to feed_items so broken lessons can be flagged without deactivating them
ALTER TABLE feed_items ADD COLUMN IF NOT EXISTS maintenance boolean NOT NULL DEFAULT false;

-- Mark known broken lessons as under maintenance
UPDATE feed_items SET maintenance = true WHERE id IN (
  'music-count-on-me',       -- Bruno Mars: captions desynced
  'music-shake-it-off',      -- Taylor Swift: transitions not rendering/synced
  'music-roar',              -- Katy Perry: caption extraction fails (captions disabled)
  'music-fix-you',           -- Coldplay: captions malformed/incomplete
  'music-dont-stop-me-now',  -- Queen: transcript returns non-English captions
  'music-bohemian-rhapsody', -- Queen: transcript returns non-English captions
  'music-let-it-be',         -- The Beatles: caption extraction fails
  'music-hey-jude',          -- The Beatles: caption extraction fails
  'music-yesterday',         -- The Beatles: caption extraction fails
  'music-come-together',     -- The Beatles: caption extraction fails
  'music-in-my-life'         -- The Beatles: caption extraction fails
);

-- Insert new songs
INSERT INTO feed_items (id, type, title, channel, artist, youtube_id, duration, level, tags, preview, maintenance) VALUES
  ('music-rolling-in-the-deep', 'music', 'Rolling in the Deep', null, 'Adele', 'rYEDA3JcQqw', '3:48', 'B1',
   array['pop','emotional','idioms','collocations'],
   'Powerful and emotionally charged. Packed with idiomatic expressions like ''rolling in the deep'', ''turning tables'' and vivid imagery of heartbreak — excellent B1 listening and vocabulary practice.',
   false),

  ('music-hello-adele', 'music', 'Hello', null, 'Adele', 'YQHsXMglC9A', '4:55', 'B2',
   array['ballad','emotional','past tense','regret'],
   'Adele''s signature rich vocabulary and emotional delivery shine here. The lyrics are full of past tense structures, conditional regret (''I must have called a thousand times'') and advanced emotional vocabulary.',
   false),

  ('music-by-the-way', 'music', 'By the Way', null, 'Red Hot Chili Peppers', 'O1tKnq7m3jA', '3:37', 'B1',
   array['rock','fast-paced','slang','conversational'],
   'Fast, punchy and packed with energy. Kiedis''s rapid-fire delivery challenges B1 learners to follow native-speed speech while picking up informal American expressions and rock slang.',
   false)

ON CONFLICT (id) DO UPDATE SET
  youtube_id  = EXCLUDED.youtube_id,
  duration    = EXCLUDED.duration,
  level       = EXCLUDED.level,
  tags        = EXCLUDED.tags,
  preview     = EXCLUDED.preview,
  maintenance = EXCLUDED.maintenance;
