-- Add claimable column to user_challenge_progress
ALTER TABLE user_challenge_progress
  ADD COLUMN IF NOT EXISTS claimable boolean NOT NULL DEFAULT false;
