-- Feature 1: Payment / Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id                     uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id     text,
  stripe_subscription_id text,
  price_id               text,
  status                 text        NOT NULL DEFAULT 'inactive',
  current_period_end     timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_id_idx             ON subscriptions(user_id);
CREATE INDEX        IF NOT EXISTS subscriptions_stripe_customer_id_idx  ON subscriptions(stripe_customer_id);
CREATE INDEX        IF NOT EXISTS subscriptions_stripe_sub_id_idx       ON subscriptions(stripe_subscription_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_subscriptions_updated_at();
