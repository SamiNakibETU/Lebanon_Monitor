/**
 * UCDP GED API fetcher — violence events in Lebanon.
 * Token via header x-ucdp-access-token (required since Feb 2026).
 * Country = 660 (Lebanon, Gleditsch-Ward code).
 * @see https://ucdp.uu.se/apidocs/
 */

import { fetchWithTimeout } from '@/lib/fetcher';
import { logger } from '@/lib/logger';
import { UCDP_CONFIG } from './config';

const SOURCE = 'ucdp';
const REGIONAL_COUNTRY_IDS = UCDP_CONFIG.countries.join(',');

export async function fetchUcdp(): Promise<
  | { ok: true; data: { Result?: unknown[] } }
  | { ok: false; error: { source: string; message: string } }
> {
  const token = process.env.UCDP_ACCESS_TOKEN;
  if (!token) {
    return { ok: false, error: { source: SOURCE, message: 'UCDP not configured' } };
  }

  const params = new URLSearchParams();
  params.set('pagesize', '100');
  params.set('Country', REGIONAL_COUNTRY_IDS);
  const since = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  params.set('StartDate', since.toISOString().slice(0, 10));

  const url = `https://ucdpapi.pcr.uu.se/api/gedevents/${UCDP_CONFIG.version}?${params.toString()}`;

  const result = await fetchWithTimeout(url, {
    headers: {
      Accept: 'application/json',
      'x-ucdp-access-token': token,
    },
  }, { timeoutMs: 15_000, source: SOURCE });

  if (!result.ok) {
    return { ok: false, error: { source: SOURCE, message: result.error.message } };
  }

  try {
    const data = (await result.data.json()) as { Result?: unknown[] };
    const count = data.Result?.length ?? 0;
    logger.info('UCDP fetch successful', { source: SOURCE, eventCount: count });
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: { source: SOURCE, message } };
  }
}
