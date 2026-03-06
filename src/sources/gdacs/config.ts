/**
 * GDACS API configuration.
 */

export const GDACS_CONFIG = {
  baseUrl: 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH',
  params: {
    eventtype: 'EQ,FL,WF,TC',
    country: 'LBN',
    alertlevel: 'Orange;Red',
    limit: '20',
  },
  ttlSeconds: 60 * 60, // 1 hour
} as const;
