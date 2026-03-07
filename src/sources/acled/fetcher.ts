/**
 * ACLED API fetcher — conflict events in Lebanon.
 */

import { fetchWithTimeout } from '@/lib/fetcher';
import { logger } from '@/lib/logger';
import type { ACLEDEvent } from './types';

const SOURCE = 'acled';

export async function fetchAcled(): Promise<
  | { ok: true; data: ACLEDEvent }
  | { ok: false; error: { source: string; message: string } }
> {
  const key = process.env.ACLED_API_KEY;
  const email = process.env.ACLED_EMAIL;
  if (!key || !email) {
    return { ok: false, error: { source: SOURCE, message: 'ACLED not configured' } };
  }

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const dateStr = since.toISOString().slice(0, 10);

  const params = new URLSearchParams();
  params.set('key', key);
  params.set('email', email);
  params.set('terms', 'accept');
  params.set('country', 'Lebanon');
  params.set('limit', '100');
  params.set('event_date_where', `>=${dateStr}`);

  const url = `https://api.acleddata.com/acled/read?${params.toString()}`;

  const result = await fetchWithTimeout(url, {
    headers: { Accept: 'application/json' },
  }, { timeoutMs: 15_000, source: SOURCE });

  if (!result.ok) {
    return { ok: false, error: { source: SOURCE, message: result.error.message } };
  }

  try {
    const data = (await result.data.json()) as ACLEDEvent;
    const count = data.data?.length ?? 0;
    logger.info('ACLED fetch successful', { source: SOURCE, eventCount: count });
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: { source: SOURCE, message } };
  }
}
