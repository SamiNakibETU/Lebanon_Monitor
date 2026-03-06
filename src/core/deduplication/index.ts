/**
 * Deduplication: merges near-duplicate events, keeping higher-priority source.
 */

import type { LebanonEvent, SourceName } from '../types';
import { SOURCE_PRIORITY } from '../constants';
import { normalizeTitle } from './normalize-title';
import { jaccardSimilarity } from './jaccard';

function getSourcePriority(source: SourceName): number {
  return SOURCE_PRIORITY[source] ?? 5;
}

/**
 * Deduplicates events: exact-same normalized title + date → keep higher priority.
 * Then, within each day, removes events that have a similar (Jaccard > 0.6) higher-priority duplicate.
 */
export function deduplicateEvents(events: LebanonEvent[]): LebanonEvent[] {
  const byKey = new Map<string, LebanonEvent>();

  for (const event of events) {
    const norm = normalizeTitle(event.title);
    const dateKey = event.timestamp instanceof Date
      ? event.timestamp.toISOString().split('T')[0]
      : new Date(event.timestamp).toISOString().split('T')[0];
    const key = `${norm}-${dateKey}`;

    const existing = byKey.get(key);
    if (
      !existing ||
      getSourcePriority(event.source as SourceName) > getSourcePriority(existing.source as SourceName)
    ) {
      byKey.set(key, event);
    }
  }

  const result = Array.from(byKey.values());
  const byDate = new Map<string, LebanonEvent[]>();
  for (const e of result) {
    const d = e.timestamp instanceof Date
      ? e.timestamp.toISOString().split('T')[0]
      : new Date(e.timestamp).toISOString().split('T')[0];
    if (!byDate.has(d)) byDate.set(d, []);
    byDate.get(d)!.push(e);
  }

  const out: LebanonEvent[] = [];
  for (const [, dayEvents] of Array.from(byDate.entries())) {
    for (const e of dayEvents) {
      const dup = dayEvents.find(
        (o) =>
          o !== e &&
          jaccardSimilarity(e.title, o.title) >= 0.6 &&
          getSourcePriority(o.source as SourceName) > getSourcePriority(e.source as SourceName)
      );
      if (!dup) out.push(e);
    }
  }

  return out;
}

export { normalizeTitle } from './normalize-title';
export { jaccardSimilarity } from './jaccard';
