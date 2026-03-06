/**
 * OpenAQ API v3 configuration.
 * Requires OPENAQ_API_KEY from https://explore.openaq.org/register
 */

export const OPENAQ_CONFIG = {
  baseUrl: 'https://api.openaq.org/v3',
  ttlSeconds: 60 * 60,
  /** Lebanon bounding box: minLng, minLat, maxLng, maxLat */
  bbox: '35.1,33.05,36.62,34.69',
} as const;
