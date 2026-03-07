/**
 * ReliefWeb API fetcher.
 * ReliefWeb requires appname; we always send the approved one.
 */

import { logger } from '@/lib/logger';
import type { ReliefWebResponse } from './types';

const SOURCE = 'reliefweb';

const APPROVED_APPNAME = 'SNakib-lebanonmonitor-sn7k2';

function buildUrl(): string {
  const base = 'https://api.reliefweb.int/v1/reports';
  const params = new URLSearchParams();
  params.set('appname', process.env.RELIEFWEB_APPNAME ?? APPROVED_APPNAME);
  params.set('filter[field]', 'country');
  params.set('filter[value]', 'Lebanon');
  params.set('limit', '20');
  params.set('sort[]', 'date:desc');
  params.append('fields[include][]', 'title');
  params.append('fields[include][]', 'date.original');
  params.append('fields[include][]', 'source');
  params.append('fields[include][]', 'url');
  params.append('fields[include][]', 'theme');
  return `${base}?${params.toString()}`;
}

const RELIEFWEB_HEADERS: HeadersInit = {
  'User-Agent': 'LebanonMonitor/1.0 (academic research project; github.com/lebanon-monitor)',
  Accept: 'application/json',
};

export async function fetchReliefWeb(): Promise<
  | { ok: true; data: ReliefWebResponse }
  | { ok: false; error: { source: string; message: string } }
> {
  const url = buildUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(url, { headers: RELIEFWEB_HEADERS, signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = (await response.text()).slice(0, 200);
      logger.error('ReliefWeb fetch failed', { source: SOURCE, status: response.status });
      return { ok: false, error: { source: SOURCE, message: `HTTP ${response.status}: ${text}` } };
    }

    const data = (await response.json()) as ReliefWebResponse;
    const count = data.data?.length ?? 0;
    logger.info('ReliefWeb fetch successful', { source: SOURCE, reportCount: count });
    return { ok: true, data };
  } catch (e) {
    clearTimeout(timeoutId);
    const message = e instanceof Error ? e.message : String(e);
    logger.error('ReliefWeb fetch failed', { source: SOURCE, message });
    return { ok: false, error: { source: SOURCE, message } };
  }
}
