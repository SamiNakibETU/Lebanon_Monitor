/**
 * Worker ingest: fetch from all connectors → raw_ingest.
 */

import { withClient } from '@/db/client';
import { createRawIngest } from '@/db/repositories/source-item-repository';
import { CONNECTORS, EVENT_SOURCE_NAMES, INDICATOR_SOURCE_NAMES } from '@/sources/connector-registry';
import { logger } from '@/lib/logger';
import type { SourceStatus } from '@/sources/registry';

export interface IndicatorPayload {
  lbp?: number | null;
  weatherBeirut?: string | null;
  aqi?: number | null;
}

export interface IngestResult {
  rawIds: Record<string, string>;
  statuses: SourceStatus[];
  indicators: IndicatorPayload;
  fetchedAt: Date;
}

export type SourceStatusValue = 'ok' | 'error' | 'rate-limited' | 'no-data' | 'skipped';

interface FetchStatus {
  source: string;
  status: SourceStatusValue;
  eventCount?: number;
  responseTimeMs?: number;
  error?: string;
  cached?: boolean;
}

/**
 * Fetch from all connectors and persist raw responses to raw_ingest.
 */
export async function runIngest(): Promise<IngestResult> {
  const fetchedAt = new Date();
  const rawIds: Record<string, string> = {};
  const statuses: SourceStatus[] = [];

  const connectors = [...CONNECTORS];
  const allSources = new Set([
    ...EVENT_SOURCE_NAMES,
    ...INDICATOR_SOURCE_NAMES,
  ]);

  const indicatorRaw: Record<string, unknown> = {};

  const results = await Promise.allSettled(
    connectors.map(async (connector) => {
      const start = Date.now();
      let status: FetchStatus = {
        source: connector.name,
        status: 'ok',
      };

      try {
        const result = await connector.fetch();

        if (result.ok && result.data !== undefined) {
          const rawPayload = result.data as Record<string, unknown>;
          const responseMetadata = { raw: rawPayload };

          if (INDICATOR_SOURCE_NAMES.has(connector.name)) {
            indicatorRaw[connector.name] = result.data;
          }

          const rawRow = await withClient(async (client) => {
            return createRawIngest(client, {
              source_name: connector.name,
              response_metadata: responseMetadata,
              raw_content_type: 'application/json',
              ingest_status: 'pending',
            });
          });

          rawIds[connector.name] = rawRow.id;
          const events = connector.normalize(result.data, fetchedAt);
          status.eventCount = events.length;
        } else {
          status.status = result.status;
          status.error = result.error?.message;
        }
        status.responseTimeMs = Date.now() - start;
        status.cached = result.cached;
      } catch (err) {
        status.status = 'error';
        status.error = err instanceof Error ? err.message : String(err);
        status.responseTimeMs = Date.now() - start;
      }

      return status;
    })
  );

  for (const r of results) {
    if (r.status === 'fulfilled') {
      statuses.push({
        source: r.value.source,
        status: r.value.status,
        eventCount: r.value.eventCount ?? 0,
        responseTimeMs: r.value.responseTimeMs,
        error: r.value.error,
        cached: r.value.cached,
      });
    }
  }

  const indicators = extractIndicators(indicatorRaw, connectors, fetchedAt);

  logger.info('Ingest completed', {
    rawCount: Object.keys(rawIds).length,
    statuses: statuses.map((s) => `${s.source}:${s.status}`).join(', '),
  });

  return { rawIds, statuses, indicators, fetchedAt };
}

function extractIndicators(
  raw: Record<string, unknown>,
  connectors: typeof CONNECTORS,
  fetchedAt: Date
): IngestResult['indicators'] {
  const indicators: IngestResult['indicators'] = {};
  const connectorMap = new Map(connectors.map((c) => [c.name, c]));

  if (raw['lbp-rate']) {
    const connector = connectorMap.get('lbp-rate');
    if (connector) {
      const events = connector.normalize(raw['lbp-rate'], fetchedAt);
      const rate = (events[0]?.rawData as { rate?: number })?.rate;
      if (typeof rate === 'number') indicators.lbp = rate;
    }
  }

  if (raw['weather']) {
    const connector = connectorMap.get('weather');
    if (connector) {
      const events = connector.normalize(raw['weather'], fetchedAt);
      const beirut = events.find((e) => e.title.toLowerCase().includes('beirut'));
      if (beirut) indicators.weatherBeirut = beirut.title.replace(/^[^:]+:\s*/, '');
    }
  }

  if (raw['openaq']) {
    const connector = connectorMap.get('openaq');
    if (connector) {
      const events = connector.normalize(raw['openaq'], fetchedAt);
      const pm25 = (events[0]?.rawData as { pm25?: number })?.pm25;
      if (typeof pm25 === 'number') indicators.aqi = Math.round(pm25);
    }
  }

  return indicators;
}
