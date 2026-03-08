/**
 * UNIFIL press releases — scrape unifil.unmissions.org for latest statements.
 */

import * as cheerio from 'cheerio';
import { logger } from '@/lib/logger';

const SOURCE = 'unifil';
const URL = 'https://unifil.unmissions.org/en/press-releases';

export interface UnifilItem {
  title: string;
  url: string;
  date?: string;
}

export async function fetchUnifilPress(): Promise<
  | { ok: true; items: UnifilItem[] }
  | { ok: false; error: string }
> {
  try {
    const res = await fetch(URL, {
      headers: { 'User-Agent': 'LebanonMonitor/1.0 (github.com/lebanon-monitor)' },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const html = await res.text();
    const $ = cheerio.load(html);

    const items: UnifilItem[] = [];
    $('a[href*="/press-releases/"]').each((_, el) => {
      const $el = $(el);
      const href = $el.attr('href') ?? '';
      const title = $el.text().trim();
      if (title && href && !href.endsWith('/press-releases') && !href.includes('#')) {
        const fullUrl = href.startsWith('http') ? href : `https://unifil.unmissions.org${href.startsWith('/') ? '' : '/'}${href}`;
        if (!items.some((i) => i.url === fullUrl)) {
          items.push({ title: title.slice(0, 120), url: fullUrl });
        }
      }
    });

    const limited = items.slice(0, 5);
    logger.info('UNIFIL fetch completed', { source: SOURCE, count: limited.length });
    return { ok: true, items: limited };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.warn('UNIFIL fetch failed', { source: SOURCE, message: msg });
    return { ok: false, error: msg };
  }
}
