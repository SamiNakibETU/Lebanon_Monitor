/**
 * Worker deduplication — Jaccard + temporal proximity against DB events.
 */

import { withClient } from '@/db/client';
import { getRecentEventTitles } from '@/db/repositories/event-observation-repository';
import { jaccardSimilarity } from '@/core/deduplication';
import type { LebanonEvent } from '@/types/events';

const JACCARD_THRESHOLD = 0.6;
const TEMPORAL_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface DedupMatch {
  eventId: string;
  confidence: number;
}

/**
 * Find an existing event that duplicates this one. Null if no match.
 */
export async function findDuplicate(
  event: LebanonEvent
): Promise<DedupMatch | null> {
  const eventTime = event.timestamp instanceof Date
    ? event.timestamp.getTime()
    : new Date(event.timestamp).getTime();
  const windowStart = new Date(eventTime - TEMPORAL_WINDOW_MS);

  const recent = await withClient((client) =>
    getRecentEventTitles(client, windowStart)
  );

  for (const existing of recent) {
    const existingTime = existing.occurred_at instanceof Date
      ? existing.occurred_at.getTime()
      : new Date(existing.occurred_at).getTime();
    if (Math.abs(existingTime - eventTime) > TEMPORAL_WINDOW_MS) continue;

    const sim = jaccardSimilarity(event.title, existing.canonical_title);
    if (sim >= JACCARD_THRESHOLD) {
      return { eventId: existing.id, confidence: sim };
    }
  }

  return null;
}
