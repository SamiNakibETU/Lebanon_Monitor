/**
 * NASA FIRMS API configuration.
 */

export const FIRMS_CONFIG = {
  baseUrl: 'https://firms.modaps.eosdis.nasa.gov/api/area/csv',
  area: '35,33,36.7,34.7', // west,south,east,north - Lebanon bbox
  days: 2,
  instrument: 'VIIRS_NOAA20_NRT',
  ttlSeconds: 3 * 60 * 60, // 3 hours
} as const;
