/**
 * Database row types aligned with PostgreSQL schema.
 */

export type GeoPrecision =
  | 'exact_point'
  | 'neighborhood'
  | 'city'
  | 'district'
  | 'governorate'
  | 'country'
  | 'inferred'
  | 'unknown';

export type PolarityUi = 'lumiere' | 'ombre' | 'neutre';

export type VerificationStatus =
  | 'unverified'
  | 'partially_verified'
  | 'verified'
  | 'disputed';

export type IngestStatus = 'pending' | 'processed' | 'failed';

export type PipelineStatus = 'running' | 'success' | 'partial_failure' | 'failure';

export interface RawIngestRow {
  id: string;
  source_name: string;
  fetch_time: Date;
  source_url: string | null;
  raw_content_type: string | null;
  raw_storage_path: string | null;
  hash: string | null;
  request_metadata: Record<string, unknown> | null;
  response_metadata: Record<string, unknown> | null;
  ingest_status: IngestStatus;
}

export interface SourceItemRow {
  id: string;
  raw_ingest_id: string | null;
  source_name: string;
  external_id: string;
  observed_title: string | null;
  observed_summary: string | null;
  observed_at: Date | null;
  source_url: string | null;
  raw_data: Record<string, unknown> | null;
  first_seen_at: Date;
  last_seen_at: Date;
}

export interface PlaceRow {
  id: string;
  name_primary: string;
  name_ar: string | null;
  name_fr: string | null;
  name_en: string | null;
  place_type: string | null;
  parent_place_id: string | null;
  lat: number | null;
  lng: number | null;
  bbox: unknown | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
}

export interface EventClusterRow {
  id: string;
  label: string | null;
  summary: string | null;
  first_event_at: Date | null;
  last_event_at: Date | null;
  event_count: number;
  metadata: Record<string, unknown> | null;
  created_at: Date;
}

export interface EventRow {
  id: string;
  canonical_title: string;
  canonical_summary: string | null;
  original_language: string | null;
  event_type: string | null;
  sub_type: string | null;
  polarity_ui: PolarityUi;
  impact_score: number | null;
  severity_score: number | null;
  confidence_score: number | null;
  verification_status: VerificationStatus;
  occurred_at: Date;
  first_seen_at: Date;
  last_seen_at: Date;
  place_id: string | null;
  geo_precision: GeoPrecision | null;
  primary_cluster_id: string | null;
  canonical_source_item_id: string | null;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

export interface IndicatorSnapshotRow {
  id: string;
  indicator_key: string;
  period_start: Date;
  period_end: Date;
  payload: Record<string, unknown>;
  computed_at: Date;
}

export interface EventObservationRow {
  id: string;
  source_item_id: string;
  event_id: string;
  observed_title: string | null;
  observed_summary: string | null;
  observed_at: Date | null;
  source_reliability_score: number | null;
  extraction_confidence: number | null;
  matching_confidence: number | null;
  dedup_reason: string | null;
  translation_status: string | null;
  geocode_status: string | null;
  created_at: Date;
}
