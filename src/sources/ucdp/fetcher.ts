/**
 * UCDP GED API fetcher — violence events in Lebanon.
 * Token via header x-ucdp-access-token (required since Feb 2026).
 * Country = 660 (Lebanon, Gleditsch-Ward code).
 * @see https://ucdp.uu.se/apidocs/
 */

import { fetchWithTimeout } from '@/lib/fetcher';
import { logger } from '@/lib/logger';

const SOURCE = 'ucdp';
const LEBANON_COUNTRY_ID = 660; // Gleditsch-Ward

export async function fetchUcdp(): Promise<
  | { ok: true; data: { Results?: unknown[] } }
  | { ok: false; error: { source: string; message: string } }
> {
  const token = process.env.UCDP_ACCESS_TOKEN;
  if (!token) {
    return { ok: false, error: { source: SOURCE, message: 'UCDP not configured' } };
  }

  const params = new URLSearchParams();
  params.set('pagesize', '100');
  params.set('Country', String(LEBANON_COUNTRY_ID));

  const url = `https://ucdpapi.pcr.uu.se/api/gedevents/25.1?${params.toString()}`;

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
    const data = (await result.data.json()) as { Results?: unknown[] };
    const count = data.Results?.length ?? 0;
    logger.info('UCDP fetch successful', { source: SOURCE, eventCount: count });
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: { source: SOURCE, message } };
  }
}
