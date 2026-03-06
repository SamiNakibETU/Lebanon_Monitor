'use client';

import { SOURCE_LABELS } from '@/lib/labels';
import type { LebanonEvent, SourceName } from '@/types/events';

interface SourceBreakdownProps {
  events: LebanonEvent[];
  theme: 'light' | 'dark';
  accentColor?: string;
}

export function SourceBreakdown({ events, theme, accentColor }: SourceBreakdownProps) {
  const counts = events.reduce<Record<SourceName, number>>(
    (acc, e) => {
      acc[e.source] = (acc[e.source] ?? 0) + 1;
      return acc;
    },
    {} as Record<SourceName, number>
  );

  const data = (Object.entries(counts) as [SourceName, number][])
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1]);

  if (data.length === 0) return null;

  const maxCount = Math.max(...data.map(([, c]) => c), 1);
  const fill = accentColor ?? (theme === 'light' ? 'var(--lumiere-accent)' : 'var(--ombre-accent)');
  const muted = theme === 'light' ? 'var(--lumiere-muted)' : 'var(--ombre-muted)';
  const trackBg = theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';

  return (
    <div className="space-y-1.5">
      {data.map(([source, count]) => (
        <div key={source} className="flex items-center gap-3">
          <div className="w-16 text-[10px] truncate shrink-0" style={{ color: muted }}>
            {SOURCE_LABELS[source]}
          </div>
          <div
            className="flex-1 h-2 overflow-hidden rounded-sm min-w-[40px]"
            style={{ background: trackBg }}
          >
            <div
              className="h-full rounded-sm"
              style={{
                width: `${(count / maxCount) * 100}%`,
                background: fill,
                opacity: 0.7,
              }}
            />
          </div>
          <span className="w-5 text-right text-[10px] tabular-nums shrink-0" style={{ color: muted }}>
            {count}
          </span>
        </div>
      ))}
    </div>
  );
}
