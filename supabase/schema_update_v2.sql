-- Add auto-approval fields to submitted_spots
ALTER TABLE submitted_spots
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS ai_verdict TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT;

-- Allow service role to insert into locations (for auto-approved submissions)
CREATE POLICY "Allow service role insert on locations" ON locations
  FOR INSERT WITH CHECK (true);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_submitted_spots_status ON submitted_spots(status);
