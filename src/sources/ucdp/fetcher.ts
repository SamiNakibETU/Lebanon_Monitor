/**
 * UCDP GED API fetcher.
 * NOT WIRED to registry — use when DB is stable.
 * Token: x-ucdp-access-token header.
 */

import { fetchWithTimeout } from '@/lib/fetcher';
import { logger } from '@/lib/logger';
import { UCDP_CONFIG } from './config';
import type { UcdpGedResponse } from './types';

const SOURCE = 'ucdp';

function buildUrl(): string {
  const base = `${UCDP_CONFIG.baseUrl}/gedevents/${UCDP_CONFIG.gedVersion}`;
  const params = new URLSearchParams();
  params.set('pagesize', '50');
  params.set('Country', String(UCDP_CONFIG.lebanonCountryId));
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 90);
  params.set('StartDate', startDate.toISOString().split('T')[0]);
  params.set('EndDate', now.toISOString().split('T')[0]);
  return `${base}?${params.toString()}`;
}

export async function fetchUcdp(): Promise<
  | { ok: true; data: UcdpGedResponse }
  | { ok: false; error: { source: string; message: string } }
> {
  const token = process.env.UCDP_ACCESS_TOKEN;
  if (!token) {
    logger.warn('UCDP_ACCESS_TOKEN not set — skipping UCDP fetch');
    return { ok: false, error: { source: SOURCE, message: 'UCDP_ACCESS_TOKEN not configured' } };
  }

  const url = buildUrl();
  const headers: HeadersInit = {
    'x-ucdp-access-token': token,
    Accept: 'application/json',
  };

  const result = await fetchWithTimeout(url, { headers }, { timeoutMs: 15_000, source: SOURCE });

  if (!result.ok) {
    logger.error('UCDP fetch failed', { source: SOURCE, message: result.error.message });
    return { ok: false, error: result.error };
  }

  try {
    const data = (await result.data.json()) as UcdpGedResponse;
    const count = data.Result?.length ?? 0;
    logger.info('UCDP fetch successful', { source: SOURCE, eventCount: count });
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logger.error('UCDP parse failed', { source: SOURCE, message });
    return { ok: false, error: { source: SOURCE, message } };
  }
}
