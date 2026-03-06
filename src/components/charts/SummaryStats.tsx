'use client';

import { CATEGORY_LABELS } from '@/lib/labels';
import type { LebanonEvent, EventCategory } from '@/types/events';

interface SummaryStatsProps {
  events: LebanonEvent[];
  theme: 'light' | 'dark';
}

function topCategory(events: LebanonEvent[]): EventCategory | null {
  const counts = events.reduce<Record<EventCategory, number>>(
    (acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + 1;
      return acc;
    },
    {} as Record<EventCategory, number>
  );
  const entries = Object.entries(counts) as [EventCategory, number][];
  const top = entries.filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : null;
}

export function SummaryStats({ events, theme }: SummaryStatsProps) {
  const total = events.length;
  const sourcesActive = new Set(events.map((e) => e.source)).size;
  const avgConf =
    events.length > 0 ? events.reduce((s, e) => s + e.confidence, 0) / events.length : 0;
  const top = topCategory(events);

  const muted = theme === 'light' ? 'var(--lumiere-muted)' : 'var(--ombre-muted)';

  return (
    <div className="grid grid-cols-4 gap-4">
      <div>
        <div
          className="text-3xl font-medium tabular-nums"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {total}
        </div>
        <div className="text-[11px] uppercase tracking-wider mt-0.5" style={{ color: muted }}>
          Total
        </div>
      </div>
      <div>
        <div
          className="text-3xl font-medium tabular-nums"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {sourcesActive}
        </div>
        <div className="text-[11px] uppercase tracking-wider mt-0.5" style={{ color: muted }}>
          Sources
        </div>
      </div>
      <div>
        <div
          className="text-3xl font-medium tabular-nums"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {(avgConf * 100).toFixed(0)}%
        </div>
        <div className="text-[11px] uppercase tracking-wider mt-0.5" style={{ color: muted }}>
          Confiance
        </div>
      </div>
      <div>
        <div
          className="text-3xl font-medium truncate"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {top ? CATEGORY_LABELS[top] : '—'}
        </div>
        <div className="text-[11px] uppercase tracking-wider mt-0.5" style={{ color: muted }}>
          Top catégorie
        </div>
      </div>
    </div>
  );
}
