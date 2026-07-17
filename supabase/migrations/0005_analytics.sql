-- Feature 2: Analytics Events
CREATE TABLE IF NOT EXISTS analytics_events (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name text        NOT NULL,
  payload    jsonb       NOT NULL DEFAULT '{}',
  ts         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analytics_events_user_id_idx    ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS analytics_events_event_name_idx ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS analytics_events_ts_idx         ON analytics_events(ts DESC);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Only server (service role) writes; users can read their own events
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'analytics_events' AND policyname = 'Users read own analytics events'
  ) THEN
    EXECUTE 'CREATE POLICY "Users read own analytics events"
      ON analytics_events FOR SELECT
      USING (auth.uid() = user_id)';
  END IF;
END $$;
