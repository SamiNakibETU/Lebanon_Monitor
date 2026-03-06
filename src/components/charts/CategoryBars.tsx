'use client';

import { CATEGORY_LABELS } from '@/lib/labels';
import type { LebanonEvent, EventCategory } from '@/types/events';

interface CategoryBarsProps {
  events: LebanonEvent[];
  maxItems?: number;
  theme: 'light' | 'dark';
  accentColor?: string;
}

export function CategoryBars({
  events,
  maxItems = 5,
  theme,
  accentColor,
}: CategoryBarsProps) {
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
  const fill = accentColor ?? (theme === 'light' ? 'var(--lumiere-accent)' : 'var(--ombre-accent)');
  const muted = theme === 'light' ? 'var(--lumiere-muted)' : 'var(--ombre-muted)';
  const trackBg = theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';

  return (
    <div className="space-y-2">
      {data.map(({ category, count, label }) => (
        <div key={category} className="flex items-center gap-4">
          <div className="w-24 text-[11px] truncate shrink-0" style={{ color: muted }}>
            {label}
          </div>
          <div
            className="flex-1 h-3 overflow-hidden rounded-sm min-w-[60px]"
            style={{ background: trackBg }}
          >
            <div
              className="h-full rounded-sm transition-all duration-300"
              style={{
                width: `${(count / maxCount) * 100}%`,
                background: fill,
                opacity: 0.8,
              }}
            />
          </div>
          <span className="w-6 text-right text-[11px] tabular-nums shrink-0" style={{ color: muted }}>
            {count}
          </span>
        </div>
      ))}
    </div>
  );
}
