/**
 * Event aggregation for analytics.
 * Phase F — compute by polarity, category, period.
 */

import type { LebanonEvent } from '@/types/events';

export interface EventAggregates {
  byPolarity: { lumiere: number; ombre: number; neutre: number };
  byCategory: Record<string, number>;
  byDay: Array<{ date: string; count: number; lumiere: number; ombre: number; neutre: number }>;
  total: number;
}

function formatDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Computes event aggregates for analytics dashboards.
 */
export function computeEventAggregates(events: LebanonEvent[]): EventAggregates {
  const byPolarity = { lumiere: 0, ombre: 0, neutre: 0 };
  const byCategory: Record<string, number> = {};
  const byDayMap = new Map<
    string,
    { count: number; lumiere: number; ombre: number; neutre: number }
  >();

  for (const e of events) {
    byPolarity[e.classification]++;
    byCategory[e.category] = (byCategory[e.category] ?? 0) + 1;

    const key = formatDateKey(e.timestamp);
    const day = byDayMap.get(key) ?? {
      count: 0,
      lumiere: 0,
      ombre: 0,
      neutre: 0,
    };
    day.count++;
    day[e.classification]++;
    byDayMap.set(key, day);
  }

  const byDay = Array.from(byDayMap.entries())
    .map(([date, d]) => ({
      date,
      count: d.count,
      lumiere: d.lumiere,
      ombre: d.ombre,
      neutre: d.neutre,
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30);

  return {
    byPolarity,
    byCategory,
    byDay,
    total: events.length,
  };
}
