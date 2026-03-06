/**
 * OpenAQ API v3 response types.
 */

export interface OpenAQV3LatestResult {
  value: number;
  coordinates?: { latitude?: number; longitude?: number };
  sensorsId: number;
  locationsId: number;
  datetime?: { utc?: string; local?: string };
}

export interface OpenAQV3LatestResponse {
  meta?: { found?: number };
  results?: OpenAQV3LatestResult[];
}

/** Legacy v2 types (for normalizer compatibility) */
export interface OpenAQMeasurement {
  parameter: string;
  value: number;
  unit?: string;
  lastUpdated?: string;
}

export interface OpenAQResult {
  location?: string;
  city?: string;
  country?: string;
  coordinates?: { latitude?: number; longitude?: number };
  measurements?: OpenAQMeasurement[];
}

export interface OpenAQResponse {
  results?: OpenAQResult[];
}
