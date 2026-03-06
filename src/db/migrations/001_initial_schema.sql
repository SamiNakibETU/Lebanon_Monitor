-- Lebanon Monitor — Initial schema
-- PostgreSQL (works without PostGIS; uses lat/lng)
-- Run with: psql $DATABASE_URL -f 001_initial_schema.sql

-- =============================================================================
-- Raw & Source
-- =============================================================================

CREATE TABLE raw_ingest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name VARCHAR(50) NOT NULL,
  fetch_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_url TEXT,
  raw_content_type VARCHAR(50),
  raw_storage_path TEXT,
  hash VARCHAR(64),
  request_metadata JSONB,
  response_metadata JSONB,
  ingest_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (ingest_status IN ('pending', 'processed', 'failed'))
);

CREATE INDEX idx_raw_ingest_source_fetch ON raw_ingest(source_name, fetch_time DESC);

-- -----------------------------------------------------------------------------

CREATE TABLE source_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_ingest_id UUID REFERENCES raw_ingest(id) ON DELETE SET NULL,
  source_name VARCHAR(50) NOT NULL,
  external_id VARCHAR(255) NOT NULL,
  observed_title TEXT,
  observed_summary TEXT,
  observed_at TIMESTAMPTZ,
  source_url TEXT,
  raw_data JSONB,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_name, external_id)
);

CREATE INDEX idx_source_item_source ON source_item(source_name);
CREATE INDEX idx_source_item_observed ON source_item(observed_at DESC);

-- =============================================================================
-- Geography
-- =============================================================================

CREATE TABLE place (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_primary VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  name_fr VARCHAR(255),
  name_en VARCHAR(255),
  place_type VARCHAR(50),
  parent_place_id UUID REFERENCES place(id) ON DELETE SET NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  bbox JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_place_coords ON place(lat, lng);
CREATE INDEX idx_place_type ON place(place_type);

-- -----------------------------------------------------------------------------

CREATE TABLE place_alias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID NOT NULL REFERENCES place(id) ON DELETE CASCADE,
  alias VARCHAR(255) NOT NULL,
  language CHAR(2),
  alias_type VARCHAR(20) DEFAULT 'canonical'
);

CREATE INDEX idx_place_alias_alias ON place_alias(alias);

-- =============================================================================
-- Events
-- =============================================================================

CREATE TABLE event_cluster (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label VARCHAR(255),
  summary TEXT,
  first_event_at TIMESTAMPTZ,
  last_event_at TIMESTAMPTZ,
  event_count INT DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------

CREATE TABLE event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_title TEXT NOT NULL,
  canonical_summary TEXT,
  original_language CHAR(2),
  event_type VARCHAR(50),
  sub_type VARCHAR(50),
  polarity_ui VARCHAR(10) NOT NULL CHECK (polarity_ui IN ('lumiere', 'ombre', 'neutre')),
  impact_score DECIMAL(3,2) CHECK (impact_score >= 0 AND impact_score <= 1),
  severity_score DECIMAL(3,2) CHECK (severity_score >= 0 AND severity_score <= 1),
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  verification_status VARCHAR(30) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'partially_verified', 'verified', 'disputed')),
  occurred_at TIMESTAMPTZ NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  place_id UUID REFERENCES place(id) ON DELETE SET NULL,
  geo_precision VARCHAR(20) CHECK (geo_precision IN ('exact_point', 'neighborhood', 'city', 'district', 'governorate', 'country', 'inferred', 'unknown')),
  primary_cluster_id UUID REFERENCES event_cluster(id) ON DELETE SET NULL,
  canonical_source_item_id UUID REFERENCES source_item(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_occurred ON event(occurred_at DESC);
CREATE INDEX idx_event_first_seen ON event(first_seen_at DESC);
CREATE INDEX idx_event_place ON event(place_id);
CREATE INDEX idx_event_cluster ON event(primary_cluster_id);
CREATE INDEX idx_event_polarity ON event(polarity_ui);
CREATE INDEX idx_event_active ON event(is_active) WHERE is_active = true;

-- -----------------------------------------------------------------------------

CREATE TABLE event_observation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_item_id UUID NOT NULL REFERENCES source_item(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  observed_title TEXT,
  observed_summary TEXT,
  observed_at TIMESTAMPTZ,
  source_reliability_score DECIMAL(3,2),
  extraction_confidence DECIMAL(3,2),
  matching_confidence DECIMAL(3,2),
  dedup_reason VARCHAR(50),
  translation_status VARCHAR(20),
  geocode_status VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_item_id, event_id)
);

CREATE INDEX idx_event_observation_event ON event_observation(event_id);
CREATE INDEX idx_event_observation_source_item ON event_observation(source_item_id);

-- =============================================================================
-- Entities & Taxonomy
-- =============================================================================

CREATE TABLE entity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  entity_type VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE event_entity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES entity(id) ON DELETE CASCADE,
  role VARCHAR(50),
  UNIQUE(event_id, entity_id, role)
);

CREATE INDEX idx_event_entity_event ON event_entity(event_id);

-- -----------------------------------------------------------------------------

CREATE TABLE taxonomy_label (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  parent_code VARCHAR(50),
  label_fr VARCHAR(255),
  label_en VARCHAR(255),
  label_ar VARCHAR(255),
  depth INT DEFAULT 0
);

CREATE TABLE event_taxonomy_assignment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  taxonomy_label_id UUID NOT NULL REFERENCES taxonomy_label(id) ON DELETE CASCADE,
  confidence DECIMAL(3,2),
  UNIQUE(event_id, taxonomy_label_id)
);

CREATE INDEX idx_event_taxonomy_event ON event_taxonomy_assignment(event_id);

-- =============================================================================
-- Translations & Social
-- =============================================================================

CREATE TABLE event_translation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  language CHAR(2) NOT NULL,
  title TEXT,
  summary TEXT,
  translated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  provider VARCHAR(50)
);

CREATE INDEX idx_event_translation_event ON event_translation(event_id);
CREATE UNIQUE INDEX idx_event_translation_event_lang ON event_translation(event_id, language);

-- -----------------------------------------------------------------------------

CREATE TABLE event_social_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  platform VARCHAR(20) NOT NULL,
  post_id VARCHAR(255),
  author_id VARCHAR(255),
  likes INT DEFAULT 0,
  reposts INT DEFAULT 0,
  replies INT DEFAULT 0,
  views INT,
  engagement_rate DECIMAL(5,4),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw_metrics JSONB
);

CREATE INDEX idx_event_social_event ON event_social_metrics(event_id);

-- =============================================================================
-- Media & Verification
-- =============================================================================

CREATE TABLE media_asset (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES event(id) ON DELETE CASCADE,
  source_item_id UUID REFERENCES source_item(id) ON DELETE SET NULL,
  media_type VARCHAR(20),
  url TEXT,
  thumbnail_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE verification_record (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  verification_status VARCHAR(30) NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source VARCHAR(50),
  metadata JSONB
);

CREATE INDEX idx_verification_event ON verification_record(event_id);

-- =============================================================================
-- Indicators & Observability
-- =============================================================================

CREATE TABLE indicator_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_key VARCHAR(100) NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_indicator_key_period ON indicator_snapshot(indicator_key, period_start DESC);

-- -----------------------------------------------------------------------------

CREATE TABLE source_health_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name VARCHAR(50) NOT NULL,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status VARCHAR(20) NOT NULL,
  response_time_ms INT,
  item_count INT,
  error_message TEXT
);

CREATE INDEX idx_source_health_source_time ON source_health_log(source_name, checked_at DESC);

-- -----------------------------------------------------------------------------

CREATE TABLE pipeline_run (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'partial_failure', 'failure')),
  sources_run TEXT[],
  raw_count INT,
  events_created INT,
  events_updated INT,
  error_details JSONB
);

-- -----------------------------------------------------------------------------

CREATE TABLE narrative_frame (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label VARCHAR(255),
  cluster_id UUID REFERENCES event_cluster(id) ON DELETE SET NULL,
  summary TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE event_relationship (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_event_id UUID NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  target_event_id UUID NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50),
  metadata JSONB,
  CHECK (source_event_id != target_event_id)
);

CREATE INDEX idx_event_relationship_source ON event_relationship(source_event_id);
CREATE INDEX idx_event_relationship_target ON event_relationship(target_event_id);
