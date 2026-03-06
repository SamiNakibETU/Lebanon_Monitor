/**
 * Basic event clustering by title similarity + temporal proximity.
 * Phase D — groups quasi-duplicates into clusters.
 */

import type { LebanonEvent } from '@/types/events';
import { normalizeTitle } from '../deduplication/normalize-title';
import { jaccardSimilarity } from '../deduplication/jaccard';

const TITLE_SIMILARITY_THRESHOLD = 0.55;
const MAX_TIME_DIFF_MS = 24 * 60 * 60 * 1000; // 24h

export interface EventWithCluster extends LebanonEvent {
  metadata: LebanonEvent['metadata'] & { clusterId?: string };
}

/**
 * Groups events into clusters by similar title and close timestamp.
 * Returns events with metadata.clusterId set.
 */
export function clusterEvents(events: LebanonEvent[]): EventWithCluster[] {
  const clusters: Map<string, string> = new Map(); // eventId -> clusterId
  let nextClusterId = 0;

  const sorted = [...events].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  for (let i = 0; i < sorted.length; i++) {
    const ea = sorted[i]!;
    const keyA = normalizeTitle(ea.title);
    const timeA = ea.timestamp.getTime();

    if (clusters.has(ea.id)) continue;

    const clusterId = `cluster-${nextClusterId}`;
    clusters.set(ea.id, clusterId);
    nextClusterId++;

    for (let j = i + 1; j < sorted.length; j++) {
      const eb = sorted[j]!;
      if (clusters.has(eb.id)) continue;

      const timeDiff = Math.abs(timeA - eb.timestamp.getTime());
      if (timeDiff > MAX_TIME_DIFF_MS) break;

      const sim = jaccardSimilarity(ea.title, eb.title);
      if (sim >= TITLE_SIMILARITY_THRESHOLD) {
        clusters.set(eb.id, clusterId);
      }
    }
  }

  return events.map((e) => {
    const cid = clusters.get(e.id);
    return {
      ...e,
      metadata: {
        ...e.metadata,
        ...(cid && { clusterId: cid }),
      },
    } as EventWithCluster;
  });
}
