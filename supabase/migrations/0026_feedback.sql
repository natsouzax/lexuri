-- Tester feedback: public form (no login required), optionally linked to a
-- logged-in user. Write-only for clients — only inserts are allowed via RLS;
-- reading happens from the Supabase dashboard (service role bypasses RLS).
CREATE TABLE IF NOT EXISTS feedback (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  type       text        NOT NULL DEFAULT 'other' CHECK (type IN ('bug', 'suggestion', 'other')),
  message    text        NOT NULL,
  email      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS feedback_created_idx ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS feedback_user_id_idx ON feedback(user_id);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'feedback' AND policyname = 'Anyone can submit feedback'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can submit feedback"
      ON feedback FOR INSERT
      WITH CHECK (true)';
  END IF;
END $$;
