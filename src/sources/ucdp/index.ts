/**
 * UCDP GED API source.
 * NOT WIRED to registry — add when DB is stable.
 * Request token: mertcan.yilmaz@pcr.uu.se
 */

export { fetchUcdp } from './fetcher';
export { normalize } from './normalizer';
export { UCDP_CONFIG } from './config';
export type { UcdpGedEvent, UcdpGedResponse } from './types';
