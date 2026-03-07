/**
 * Core event types for Lebanon Monitor.
 * All data sources normalize to LebanonEvent.
 */

export type SourceName =
  | "gdelt"
  | "usgs"
  | "firms"
  | "rss"
  | "gdacs"
  | "reliefweb"
  | "weather"
  | "cloudflare"
  | "lbp-rate"
  | "openaq"
  | "twitter"
  | "acled"
  | "ucdp"
  | "telegram";

export type EventCategory =
  | "cultural_event"
  | "reconstruction"
  | "institutional_progress"
  | "solidarity"
  | "economic_positive"
  | "international_recognition"
  | "environmental_positive"
  | "armed_conflict"
  | "economic_crisis"
  | "political_tension"
  | "displacement"
  | "infrastructure_failure"
  | "environmental_negative"
  | "disinformation"
  | "violence"
  | "neutral";

export type Classification = "lumiere" | "ombre" | "neutre";

export type Severity = "low" | "medium" | "high" | "critical";

export type SourceReliability = "high" | "medium" | "low";

export interface LebanonEvent {
  id: string;
  source: SourceName;
  title: string;
  description?: string;
  url?: string;
  timestamp: Date;
  latitude: number;
  longitude: number;
  classification: Classification;
  confidence: number;
  category: EventCategory;
  severity: Severity;
  rawData?: Record<string, unknown>;
  metadata: {
    fetchedAt: Date;
    ttlSeconds: number;
    sourceReliability: SourceReliability;
    /** Phase D: language detection */
    originalLanguage?: "ar" | "fr" | "en";
    languageConfidence?: number;
    /** Phase D: taxonomy code from docs/TAXONOMY.md */
    taxonomyCode?: string;
    /** Phase D: extracted entities */
    extractedEntities?: {
      persons: string[];
      parties: string[];
      cities: string[];
      organizations: string[];
    };
    /** Phase D: cluster ID for grouping similar events */
    clusterId?: string;
    /** Phase E: geo precision from place resolution */
    geoPrecision?:
      | "exact_point"
      | "neighborhood"
      | "city"
      | "district"
      | "governorate"
      | "country"
      | "inferred"
      | "unknown";
    /** Phase E: resolved place name when geocoded from text */
    resolvedPlaceName?: string;
  };
}
