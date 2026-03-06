/**
 * USGS Earthquake API configuration.
 */

import { LEBANON_BBOX } from '@/config/lebanon';

export const USGS_CONFIG = {
  baseUrl: 'https://earthquake.usgs.gov/fdsnws/event/1/query',
  params: {
    format: 'geojson',
    minlatitude: String(LEBANON_BBOX.minLat),
    maxlatitude: String(LEBANON_BBOX.maxLat),
    minlongitude: String(LEBANON_BBOX.minLng),
    maxlongitude: String(LEBANON_BBOX.maxLng),
    minmagnitude: '2.0',
    orderby: 'time',
    limit: '20',
  },
  ttlSeconds: 5 * 60, // 5 minutes
} as const;
