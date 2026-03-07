/**
 * Worker clustering — group similar events into event_cluster.
 * Runs after store; clusters events from last 24h by title similarity.
 */

import { withClient } from '@/db/client';
import { getRecentUnclusteredEvents, updateEventPrimaryCluster } from '@/db/repositories/event-repository';
import { createEventCluster } from '@/db/repositories/event-cluster-repository';
import type { EventRow } from '@/db/types';
import { logger } from '@/lib/logger';

const TITLE_SIMILARITY_THRESHOLD = 0.35; // Jaccard-like overlap
const MIN_CLUSTER_SIZE = 2;

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  const inter = [...a].filter((x) => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union > 0 ? inter / union : 0;
}

export async function runCluster(): Promise<{ clustersCreated: number; eventsClustered: number }> {
  const since = new Date();
  since.setDate(since.getDate() - 1);

  const events = await withClient((client) =>
    getRecentUnclusteredEvents(client, since, 500)
  );

  if (events.length < MIN_CLUSTER_SIZE) {
    return { clustersCreated: 0, eventsClustered: 0 };
  }

  const byType = new Map<string, EventRow[]>();
  for (const e of events) {
    const key = e.event_type ?? 'neutral';
    const list = byType.get(key) ?? [];
    list.push(e);
    byType.set(key, list);
  }

  let clustersCreated = 0;
  let eventsClustered = 0;

  for (const [, list] of byType) {
    const tokens = list.map((e) => tokenize(e.canonical_title ?? ''));
    const used = new Set<number>();

    for (let i = 0; i < list.length; i++) {
      if (used.has(i)) continue;
      const group = [i];
      used.add(i);

      for (let j = i + 1; j < list.length; j++) {
        if (used.has(j)) continue;
        const sim = jaccard(tokens[i]!, tokens[j]!);
        if (sim >= TITLE_SIMILARITY_THRESHOLD) {
          group.push(j);
          used.add(j);
        }
      }

      if (group.length >= MIN_CLUSTER_SIZE) {
        const evts = group.map((idx) => list[idx]!);
        const firstAt = evts.reduce((min, e) => (e.occurred_at < min ? e.occurred_at : min), evts[0]!.occurred_at);
        const lastAt = evts.reduce((max, e) => (e.occurred_at > max ? e.occurred_at : max), evts[0]!.occurred_at);
        const label = evts[0]!.canonical_title?.slice(0, 100) ?? 'Cluster';

        const cluster = await withClient((client) =>
          createEventCluster(client, {
            label,
            first_event_at: firstAt,
            last_event_at: lastAt,
            event_count: evts.length,
          })
        );

        for (const e of evts) {
          await withClient((client) => updateEventPrimaryCluster(client, e.id, cluster.id));
        }
        clustersCreated++;
        eventsClustered += evts.length;
      }
    }
  }

  logger.info('Clustering complete', { clustersCreated, eventsClustered });
  return { clustersCreated, eventsClustered };
}
