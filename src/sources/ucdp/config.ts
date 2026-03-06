/**
 * UCDP API configuration.
 * NOT WIRED — for future use when DB is stable.
 */

export const UCDP_CONFIG = {
  baseUrl: 'https://ucdpapi.pcr.uu.se/api',
  gedVersion: '25.1',
  /** Gleditsch-Ward: Lebanon = 660 */
  lebanonCountryId: 660,
  defaultCoords: { lat: 33.8938, lng: 35.5018 },
  ttlSeconds: 3600,
} as const;
