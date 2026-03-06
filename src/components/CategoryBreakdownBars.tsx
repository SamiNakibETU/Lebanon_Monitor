'use client';

import { CATEGORY_LABELS } from '@/lib/labels';
import type { LebanonEvent } from '@/types/events';
import type { EventCategory } from '@/types/events';

interface CategoryBreakdownBarsProps {
  events: LebanonEvent[];
  maxItems?: number;
  theme?: 'light' | 'dark';
  barColor?: string;
}

export function CategoryBreakdownBars({
  events,
  maxItems = 5,
  theme = 'dark',
  barColor,
}: CategoryBreakdownBarsProps) {
  const counts = events.reduce<Record<EventCategory, number>>(
    (acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + 1;
      return acc;
    },
    {} as Record<EventCategory, number>
  );

  const data = (Object.entries(counts) as [EventCategory, number][])
    .filter(([, c]) => c > 0)
    .map(([cat, count]) => ({ category: cat, count, label: CATEGORY_LABELS[cat] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, maxItems);

  if (data.length === 0) return null;

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const fill = barColor ?? (theme === 'light' ? 'var(--lumiere-accent)' : 'var(--ombre-accent)');
  const muted = theme === 'light' ? 'var(--lumiere-muted)' : 'var(--ombre-muted)';
  const trackBg = theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';

  return (
    <div className="space-y-1.5">
      {data.map(({ category, count, label }) => (
        <div key={category} className="flex items-center gap-3">
          <div className="w-14 text-[10px] truncate" style={{ color: muted }}>
            {label}
          </div>
          <div
            className="flex-1 h-1.5 overflow-hidden rounded-sm"
            style={{ background: trackBg }}
          >
            <div
              className="h-full rounded-sm transition-all duration-300"
              style={{
                width: `${(count / maxCount) * 100}%`,
                background: fill,
              }}
            />
          </div>
          <span className="w-5 text-right text-[10px] tabular-nums" style={{ color: muted }}>
            {count}
          </span>
        </div>
      ))}
    </div>
  );
}
