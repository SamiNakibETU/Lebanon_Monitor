/**
 * ReliefWeb API fetcher.
 * ReliefWeb requires appname; we always send the approved one.
 */

import { logger } from '@/lib/logger';
import type { ReliefWebResponse } from './types';

const SOURCE = 'reliefweb';

const APPROVED_APPNAME = 'SNakib-lebanonmonitor-sn7k2';

const LEBANON_KEYWORDS = ['lebanon', 'lebanese', 'beirut', 'liban', 'hezbollah', 'unifil'];

function mentionsLebanon(text: string): boolean {
  const lower = text.toLowerCase();
  return LEBANON_KEYWORDS.some((kw) => lower.includes(kw));
}

function buildUrl(): string {
  const base = 'https://api.reliefweb.int/v2/reports';
  const params = new URLSearchParams();
  params.set('appname', process.env.RELIEFWEB_APPNAME ?? APPROVED_APPNAME);
  params.set('filter[operator]', 'OR');
  params.set('filter[conditions][0][field]', 'primary_country');
  params.set('filter[conditions][0][value]', 'Lebanon');
  params.set('filter[conditions][1][field]', 'primary_country');
  params.set('filter[conditions][1][value]', 'Syria');
  params.set('limit', '40');
  params.set('sort[]', 'date:desc');
  params.append('fields[include][]', 'title');
  params.append('fields[include][]', 'date.original');
  params.append('fields[include][]', 'source');
  params.append('fields[include][]', 'url');
  params.append('fields[include][]', 'theme');
  params.append('fields[include][]', 'body');
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
    let response = await fetch(url, { headers: RELIEFWEB_HEADERS, signal: controller.signal });
    if (response.status === 404 && url.includes('/v2/')) {
      const v1Url = url.replace('/v2/', '/v1/');
      response = await fetch(v1Url, { headers: RELIEFWEB_HEADERS, signal: controller.signal });
    }
    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = (await response.text()).slice(0, 200);
      logger.error('ReliefWeb fetch failed', { source: SOURCE, status: response.status });
      return { ok: false, error: { source: SOURCE, message: `HTTP ${response.status}: ${text}` } };
    }

    const data = (await response.json()) as ReliefWebResponse;
    const raw = data.data ?? [];
    const filtered = raw.filter((r) => {
      const title = r.fields?.title ?? '';
      const body = r.fields?.['body-html'] ?? '';
      return mentionsLebanon(title) || mentionsLebanon(body);
    });
    const limited = filtered.slice(0, 20);
    logger.info('ReliefWeb fetch successful', { source: SOURCE, reportCount: limited.length, rawCount: raw.length });
    return { ok: true, data: { ...data, data: limited } };
  } catch (e) {
    clearTimeout(timeoutId);
    const message = e instanceof Error ? e.message : String(e);
    logger.error('ReliefWeb fetch failed', { source: SOURCE, message });
    return { ok: false, error: { source: SOURCE, message } };
  }
}
