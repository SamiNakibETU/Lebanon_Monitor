-- Add claim_type to claim table for Phase 2 claim graph.
ALTER TABLE claim ADD COLUMN IF NOT EXISTS claim_type VARCHAR(50);
