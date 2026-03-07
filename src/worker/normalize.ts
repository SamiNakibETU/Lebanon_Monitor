/**
 * Worker normalize: raw_ingest → source_item. Returns new items for processing.
 */

import type { PoolClient } from 'pg';
import { withClient } from '@/db/client';
import { findSourceItem, upsertSourceItem } from '@/db/repositories/source-item-repository';
import { CONNECTORS } from '@/sources/connector-registry';
import type { LebanonEvent } from '@/types/events';
import type { SourceItemRow } from '@/db/types';

export interface NewSourceItem {
  sourceItem: SourceItemRow;
  event: LebanonEvent;
}

/**
 * Process raw ingest records: normalize to source_item, return only NEW items.
 */
export async function runNormalize(
  rawIds: Record<string, string>
): Promise<NewSourceItem[]> {
  const connectorMap = new Map(CONNECTORS.map((c) => [c.name, c]));
  const newItems: NewSourceItem[] = [];

  await withClient(async (client) => {
    for (const [sourceName, rawId] of Object.entries(rawIds)) {
      const connector = connectorMap.get(sourceName);
      if (!connector) continue;

      const raw = await getRawPayload(client, rawId);
      if (!raw) continue;

      const fetchedAt = new Date();
      let events: LebanonEvent[];

      try {
        events = connector.normalize(raw, fetchedAt);
      } catch (err) {
        continue;
      }

      const rawIngestId = rawIds[sourceName] ?? null;

      for (const event of events) {
        const externalId = event.id;
        const existing = await findSourceItem(client, sourceName, externalId);

        const sourceItem = await upsertSourceItem(client, {
          raw_ingest_id: rawIngestId,
          source_name: sourceName,
          external_id: externalId,
          observed_title: event.title,
          observed_summary: event.description ?? undefined,
          observed_at: event.timestamp,
          source_url: event.url ?? undefined,
          raw_data: event.rawData ?? undefined,
        });

        if (!existing) {
          newItems.push({ sourceItem, event });
        }
      }
    }
  });

  return newItems;
}

async function getRawPayload(
  client: PoolClient,
  rawId: string
): Promise<unknown | null> {
  const { rows } = await client.query<{ response_metadata: { raw?: unknown } | null }>(
    'SELECT response_metadata FROM raw_ingest WHERE id = $1',
    [rawId]
  );
  const meta = rows[0]?.response_metadata;
  return meta && typeof meta === 'object' && 'raw' in meta ? meta.raw : null;
}
