-- ============================================================
-- 0013: Plans catalogue + Coupon codes + Limits enforcement
-- ============================================================

-- Plan definitions (free, pro, etc.)
CREATE TABLE IF NOT EXISTS plans (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  key             text        NOT NULL UNIQUE,   -- 'free' | 'pro' | 'lifetime'
  name            text        NOT NULL,
  price_monthly   numeric(10,2),
  price_yearly    numeric(10,2),
  stripe_price_id text,                          -- live Stripe price ID
  limits          jsonb       NOT NULL DEFAULT '{}',
  active          boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'plans' AND policyname = 'anyone reads active plans'
  ) THEN
    EXECUTE 'CREATE POLICY "anyone reads active plans"
      ON plans FOR SELECT USING (active = true)';
  END IF;
END $$;

-- Seed default plans (ON CONFLICT keeps existing rows untouched)
INSERT INTO plans (key, name, price_monthly, price_yearly, limits) VALUES
  ('free',     'Free',     0,     0,     '{"yt_imports":3,"music_imports":3,"chunk_analyses":5,"feed_opens":5}'),
  ('pro',      'Pro',      9.90,  89.90, '{"yt_imports":50,"music_imports":50,"chunk_analyses":200,"feed_opens":200}'),
  ('lifetime', 'Lifetime', null,  null,  '{"yt_imports":-1,"music_imports":-1,"chunk_analyses":-1,"feed_opens":-1}')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------
-- Coupon codes catalogue (what codes are valid and what they grant)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupon_codes (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text        NOT NULL UNIQUE,
  description     text        NOT NULL DEFAULT '',
  -- what the coupon does
  grants_plan_key text        REFERENCES plans(key) ON DELETE SET NULL,
  grants_days     integer,                         -- NULL = permanent while premium_until is set
  max_uses        integer,                         -- NULL = unlimited
  uses_count      integer     NOT NULL DEFAULT 0,
  active          boolean     NOT NULL DEFAULT true,
  expires_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE coupon_codes ENABLE ROW LEVEL SECURITY;

-- Users cannot read the codes table (prevents brute-force listing)
-- Redemption is handled server-side via service-role

-- ---------------------------------------------------------------
-- profile → plan link (which plan the user is currently on)
-- ---------------------------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_key text NOT NULL DEFAULT 'free'
  REFERENCES plans(key);

-- premium_until already added in 0012; add plan_key index
CREATE INDEX IF NOT EXISTS profiles_plan_key_idx ON profiles(plan_key);

-- ---------------------------------------------------------------
-- coupon_redemptions: add FK to coupon_codes.code if column exists
-- (0012 already created the table; just add the index)
-- ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS coupon_redemptions_code_idx ON coupon_redemptions(coupon_code);

-- ---------------------------------------------------------------
-- weekly_usage: index to speed up week-reset queries
-- ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS user_weekly_usage_week_idx ON user_weekly_usage(week_start);
