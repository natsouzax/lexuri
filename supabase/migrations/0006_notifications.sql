-- Feature 3: In-app Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text        NOT NULL,
  body       text        NOT NULL DEFAULT '',
  data       jsonb       NOT NULL DEFAULT '{}',
  read       boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx  ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_unread_idx   ON notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS notifications_created_idx  ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notifications' AND policyname = 'Users read own notifications'
  ) THEN
    EXECUTE 'CREATE POLICY "Users read own notifications"
      ON notifications FOR SELECT
      USING (auth.uid() = user_id)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notifications' AND policyname = 'Users update own notifications'
  ) THEN
    EXECUTE 'CREATE POLICY "Users update own notifications"
      ON notifications FOR UPDATE
      USING (auth.uid() = user_id)';
  END IF;
END $$;

-- Enable Realtime on this table (run in Supabase dashboard or via API)
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
