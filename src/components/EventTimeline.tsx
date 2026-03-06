'use client';

import type { LebanonEvent } from '@/types/events';
import type { Classification } from '@/types/events';

interface EventTimelineProps {
  events: LebanonEvent[];
  maxItems?: number;
}

function dotColor(c: Classification): string {
  if (c === 'lumiere') return 'var(--lumiere-accent)';
  if (c === 'ombre') return 'var(--ombre-accent)';
  return 'var(--neutre)';
}

export function EventTimeline({ events, maxItems = 24 }: EventTimelineProps) {
  const sorted = [...events]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, maxItems);

  if (sorted.length === 0) return null;

  return (
    <div
      className="flex gap-0.5 overflow-x-auto py-2 pb-1 scrollbar-thin"
      style={{ minHeight: 40 }}
    >
      {sorted.map((e) => (
        <div
          key={e.id}
          className="shrink-0 w-3 h-6 rounded-sm cursor-default"
          style={{
            background: dotColor(e.classification),
            opacity: 0.85,
          }}
          title={`${e.title.slice(0, 40)}… — ${e.timestamp.toLocaleTimeString('fr-FR')}`}
        />
      ))}
    </div>
  );
}
