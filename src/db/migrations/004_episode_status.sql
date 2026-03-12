-- Add status to episode (open/closed) for Phase 3.
ALTER TABLE episode ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed'));
CREATE INDEX IF NOT EXISTS idx_episode_status ON episode(status);
