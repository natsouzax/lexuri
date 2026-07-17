-- Add Spotify OAuth token storage to profiles.
-- Tokens are per-user and encrypted at rest by Supabase.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS spotify_refresh_token  text,
  ADD COLUMN IF NOT EXISTS spotify_access_token   text,
  ADD COLUMN IF NOT EXISTS spotify_token_expiry   timestamptz;
