/**
 * Core types for Lebanon Monitor data layer.
 * PURE TypeScript — no React, no Next.js, no DOM.
 */

export type EventSourceName =
  | 'gdelt'
  | 'usgs'
  | 'firms'
  | 'rss'
  | 'gdacs'
  | 'reliefweb'
  | 'twitter'
  | 'cloudflare'
  | 'acled'
  | 'ucdp'
  | 'telegram';

export type IndicatorSourceName = 'weather' | 'lbp-rate' | 'openaq';

export type SourceName = EventSourceName | IndicatorSourceName;

export type Classification = 'lumiere' | 'ombre' | 'neutre';

export type OmbreCategory =
  | 'armed_conflict'
  | 'economic_crisis'
  | 'political_tension'
  | 'displacement'
  | 'infrastructure_failure'
  | 'environmental_negative'
  | 'disinformation'
  | 'violence';

export type LumiereCategory =
  | 'cultural_event'
  | 'reconstruction'
  | 'institutional_progress'
  | 'solidarity'
  | 'economic_positive'
  | 'international_recognition'
  | 'environmental_positive';

export type EventCategory = OmbreCategory | LumiereCategory | 'neutral';

export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type SourceReliability = 'high' | 'medium' | 'low';

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
  };
}

export interface ClassificationResult {
  classification: Classification;
  confidence: number;
  category: EventCategory;
  method: 'pre-classifier' | 'keyword' | 'ensemble' | 'tone';
}

export interface Indicators {
  weather?: { city: string; temp: number; condition: string };
  lbpRate?: { rate: number; trend?: 'up' | 'down' | 'stable' };
  airQuality?: { pm25?: number; location?: string };
}

export interface SourceStatus {
  source: string;
  status: 'ok' | 'error' | 'rate-limited' | 'no-data' | 'skipped';
  eventCount: number;
  responseTimeMs?: number;
  error?: string;
  cached?: boolean;
}
