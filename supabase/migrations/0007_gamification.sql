-- Feature 4: Gamification & Performance Reports

-- Aggregate stats per user (updated on each review)
CREATE TABLE IF NOT EXISTS user_stats (
  user_id       uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  points        int         NOT NULL DEFAULT 0,
  streak        int         NOT NULL DEFAULT 0,
  total_reviews int         NOT NULL DEFAULT 0,
  last_active   timestamptz
);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own stats"      ON user_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own stats"    ON user_stats FOR UPDATE USING (auth.uid() = user_id);

-- Immutable ledger of point-earning events (idempotent via event_id)
CREATE TABLE IF NOT EXISTS points_history (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text        NOT NULL,
  points     int         NOT NULL DEFAULT 0,
  metadata   jsonb       NOT NULL DEFAULT '{}',
  event_ts   timestamptz NOT NULL DEFAULT now(),
  event_id   text        NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS points_history_user_id_idx  ON points_history(user_id);
CREATE INDEX IF NOT EXISTS points_history_event_ts_idx ON points_history(event_ts DESC);

ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own points history"
  ON points_history FOR SELECT USING (auth.uid() = user_id);

-- Badge definitions (seed below)
CREATE TABLE IF NOT EXISTS badges (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  key         text        NOT NULL UNIQUE,
  name        text        NOT NULL,
  description text        NOT NULL DEFAULT '',
  criteria    jsonb       NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads badges"
  ON badges FOR SELECT USING (true);

-- Earned badges per user (at most one row per user+badge)
CREATE TABLE IF NOT EXISTS user_badges (
  id        uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  badge_id  uuid        NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  user_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(badge_id, user_id)
);

CREATE INDEX IF NOT EXISTS user_badges_user_id_idx ON user_badges(user_id);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own badges"
  ON user_badges FOR SELECT USING (auth.uid() = user_id);

-- Seed badges
INSERT INTO badges (key, name, description, criteria) VALUES
  ('novice',        'Novice',             'Complete 10 reviews',                         '{"total_reviews": 10}'),
  ('consistent',    'Consistent',         'Maintain a 7-day streak',                     '{"streak": 7}'),
  ('marathoner',    'Marathoner',         'Complete 500 total reviews',                  '{"total_reviews": 500}'),
  ('speedster',     'Speedster',          '50 reviews with average response time < 10s', '{"fast_reviews": 50}'),
  ('streak_master', 'Streak Master',      'Maintain a 30-day streak',                    '{"streak": 30}'),
  ('centurion',     'Centurion',          'Earn 1000 total points',                      '{"points": 1000}')
ON CONFLICT (key) DO NOTHING;

-- Update user_stats.last_active trigger
CREATE OR REPLACE FUNCTION upsert_user_stats_on_review()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN RETURN NEW; END;
$$;
