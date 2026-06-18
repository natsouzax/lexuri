-- Coupon support on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS premium_until timestamptz;

-- Coupon redemption log (prevents double-use per user per code)
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coupon_code   text NOT NULL,
  redeemed_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, coupon_code)
);

ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'coupon_redemptions' AND policyname = 'users read own redemptions'
  ) THEN
    EXECUTE 'CREATE POLICY "users read own redemptions"
      ON coupon_redemptions FOR SELECT
      USING (auth.uid() = user_id)';
  END IF;
END $$;

-- Weekly usage counters (reset each calendar week)
-- feed_opens: curated feed lessons opened; yt_imports: user-pasted YouTube URLs
CREATE TABLE IF NOT EXISTS user_weekly_usage (
  user_id        uuid    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start     date    NOT NULL DEFAULT date_trunc('week', now())::date,
  yt_imports     integer NOT NULL DEFAULT 0,
  music_imports  integer NOT NULL DEFAULT 0,
  chunk_analyses integer NOT NULL DEFAULT 0,
  feed_opens     integer NOT NULL DEFAULT 0
);

-- Safely add columns if table already existed from a partial migration
ALTER TABLE user_weekly_usage ADD COLUMN IF NOT EXISTS music_imports  integer NOT NULL DEFAULT 0;
ALTER TABLE user_weekly_usage ADD COLUMN IF NOT EXISTS chunk_analyses integer NOT NULL DEFAULT 0;
ALTER TABLE user_weekly_usage ADD COLUMN IF NOT EXISTS feed_opens     integer NOT NULL DEFAULT 0;

ALTER TABLE user_weekly_usage ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_weekly_usage' AND policyname = 'users read own weekly usage'
  ) THEN
    EXECUTE 'CREATE POLICY "users read own weekly usage"
      ON user_weekly_usage FOR SELECT
      USING (auth.uid() = user_id)';
  END IF;
END $$;
