-- Lebanon Monitor — Claim, Episode, Geo quality (Phase 1)
-- Extends 001_initial_schema.sql with analytical objects from Director Brief.

-- =============================================================================
-- Claims
-- =============================================================================

CREATE TABLE claim (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES event(id) ON DELETE CASCADE,
  source_item_id UUID REFERENCES source_item(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  status VARCHAR(30) NOT NULL DEFAULT 'asserted' CHECK (status IN ('asserted', 'contradicted', 'retracted')),
  retracted_at TIMESTAMPTZ,
  superseded_by_id UUID REFERENCES claim(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_claim_event ON claim(event_id);
CREATE INDEX idx_claim_source_item ON claim(source_item_id);
CREATE INDEX idx_claim_status ON claim(status);

-- -----------------------------------------------------------------------------

CREATE TABLE claim_contradiction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id_a UUID NOT NULL REFERENCES claim(id) ON DELETE CASCADE,
  claim_id_b UUID NOT NULL REFERENCES claim(id) ON DELETE CASCADE,
  contradiction_type VARCHAR(20) DEFAULT 'direct' CHECK (contradiction_type IN ('direct', 'partial')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (claim_id_a != claim_id_b)
);

CREATE INDEX idx_claim_contradiction_a ON claim_contradiction(claim_id_a);
CREATE INDEX idx_claim_contradiction_b ON claim_contradiction(claim_id_b);

-- =============================================================================
-- Episodes (analytic clusters, distinct from event_cluster Jaccard clusters)
-- =============================================================================

CREATE TABLE episode (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label VARCHAR(255),
  summary TEXT,
  first_event_at TIMESTAMPTZ,
  last_event_at TIMESTAMPTZ,
  event_count INT DEFAULT 0,
  footprint_geojson JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_episode_first_event ON episode(first_event_at DESC);
CREATE INDEX idx_episode_last_event ON episode(last_event_at DESC);

-- -----------------------------------------------------------------------------

CREATE TABLE episode_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL REFERENCES episode(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  "order" INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(episode_id, event_id)
);

CREATE INDEX idx_episode_event_episode ON episode_event(episode_id);
CREATE INDEX idx_episode_event_event ON episode_event(event_id);

-- Link event to primary episode (optional, for quick lookup)
ALTER TABLE event ADD COLUMN IF NOT EXISTS primary_episode_id UUID REFERENCES episode(id) ON DELETE SET NULL;
CREATE INDEX idx_event_primary_episode ON event(primary_episode_id) WHERE primary_episode_id IS NOT NULL;

-- =============================================================================
-- Geo quality on event (method, uncertainty)
-- =============================================================================

ALTER TABLE event ADD COLUMN IF NOT EXISTS geo_method VARCHAR(30) CHECK (geo_method IN ('source_exact', 'gazetteer', 'llm', 'inferred', 'unknown'));
ALTER TABLE event ADD COLUMN IF NOT EXISTS uncertainty_radius_m INT CHECK (uncertainty_radius_m >= 0);
