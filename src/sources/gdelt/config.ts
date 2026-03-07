/**
 * GDELT DOC API configuration.
 */

export const GDELT_CONFIG = {
  baseUrl: 'https://api.gdeltproject.org/api/v2/doc/doc',
  query: 'sourceloc:Lebanon',
  mode: 'ArtList',
  maxRecords: 75,
  format: 'json',
  sort: 'DateDesc',
  timespan: '1d',
  ttlSeconds: 15 * 60, // 15 minutes
  minIntervalMs: 12000, // 12 seconds between requests (rate limit)
  cacheTtlMs: 15 * 60 * 1000, // 15 min cache
  backoffMs: 60000, // 60s backoff on 429
  maxRetries: 1,
} as const;
