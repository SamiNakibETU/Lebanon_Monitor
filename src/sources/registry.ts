/**
 * Source registry and aggregator.
 * Uses declarative connector registry (Phase C).
 */

import type { LebanonEvent } from '@/types/events';
import { classify } from '@/core/classification';
import { deduplicateEvents } from '@/core/deduplication';
import { enrichEvents } from '@/core/enrichment';
import { clusterEvents } from '@/core/clustering';
import { CONNECTORS, EVENT_SOURCE_NAMES } from './connector-registry';
import { persistIndicatorSnapshots } from '@/analytics/persist';
import { logger } from '@/lib/logger';

const CACHE_TTL_MS = 60_000; // 1 min pour éviter de surcharger les sources
let cache: {
  result: Awaited<ReturnType<typeof fetchAllUncached>>;
  expiresAt: number;
} | null = null;

export interface SourceStatus {
  source: string;
  status: 'ok' | 'error' | 'rate-limited' | 'no-data' | 'skipped';
  eventCount: number;
  responseTimeMs?: number;
  error?: string;
  cached?: boolean;
}

/**
 * Fetches from all connectors in parallel and returns unified events.
 * Result cached for 1 minute to reduce load on external APIs.
 */
export async function fetchAll(): Promise<{
  events: LebanonEvent[];
  statuses: SourceStatus[];
  indicators: { lbp: number | null; weatherBeirut: string | null; aqi: number | null };
}> {
  const now = Date.now();
  if (cache && now < cache.expiresAt) {
    logger.info('fetchAll serving from cache', { expiresIn: cache.expiresAt - now });
    return cache.result;
  }
  const result = await fetchAllUncached();
  cache = { result, expiresAt: now + CACHE_TTL_MS };
  return result;
}

async function fetchAllUncached(): Promise<{
  events: LebanonEvent[];
  statuses: SourceStatus[];
  indicators: { lbp: number | null; weatherBeirut: string | null; aqi: number | null };
}> {
  const fetchedAt = new Date();
  const allEvents: LebanonEvent[] = [];

  const results = await Promise.allSettled(
    CONNECTORS.map(async (connector) => {
      const result = await connector.fetch();
      const events: LebanonEvent[] = [];

      if (result.ok && result.data !== undefined) {
        try {
          events.push(...connector.normalize(result.data, fetchedAt));
        } catch (e) {
          logger.warn('Normalize failed', {
            source: connector.name,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }

      const status: SourceStatus = {
        source: connector.name,
        status: result.status,
        eventCount: events.length,
        responseTimeMs: result.responseTimeMs,
        error: result.error?.message,
        cached: result.cached,
      };

      return { events, status };
    })
  );

  const statuses: SourceStatus[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) {
      allEvents.push(...r.value.events);
      statuses.push(r.value.status);
    }
  }

  let eventsForPanels = allEvents.filter((e) => EVENT_SOURCE_NAMES.has(e.source));

  eventsForPanels = eventsForPanels.map((e) => {
    const tone =
      e.source === 'gdelt' &&
      e.rawData &&
      typeof (e.rawData as { tone?: number }).tone === 'number'
        ? (e.rawData as { tone: number }).tone
        : undefined;
    const result = classify(e.title, { tone });
    return {
      ...e,
      classification: result.classification,
      confidence: result.confidence,
      category: result.category,
    };
  });

  eventsForPanels = deduplicateEvents(eventsForPanels);
  eventsForPanels = enrichEvents(eventsForPanels);
  eventsForPanels = clusterEvents(eventsForPanels);
  eventsForPanels.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const lbpEvent = allEvents.find((e) => e.source === 'lbp-rate');
  const lbp =
    lbpEvent?.rawData && typeof (lbpEvent.rawData as { rate?: number }).rate === 'number'
      ? (lbpEvent.rawData as { rate: number }).rate
      : null;

  const weatherBeirut = allEvents.find(
    (e) => e.source === 'weather' && e.title.toLowerCase().includes('beirut')
  );
  const weatherBeirutStr = weatherBeirut
    ? weatherBeirut.title.replace(/^[^:]+:\s*/, '')
    : null;

  const openaqEvent = allEvents.find((e) => e.source === 'openaq');
  const aqi =
    openaqEvent?.rawData && typeof (openaqEvent.rawData as { pm25?: number }).pm25 === 'number'
      ? Math.round((openaqEvent.rawData as { pm25: number }).pm25)
      : null;

  const indicators = { lbp, weatherBeirut: weatherBeirutStr, aqi };
  persistIndicatorSnapshots(indicators, new Date()).catch(() => {});

  logger.info('fetchAll completed', {
    totalEvents: allEvents.length,
    panelEvents: eventsForPanels.length,
    summary: statuses.map((s) => `${s.source}:${s.status}`).join(', '),
  });

  return {
    events: eventsForPanels,
    statuses,
    indicators,
  };
}

/** Invalide le cache (utile pour tests ou admin). */
export function invalidateFetchCache(): void {
  cache = null;
}
