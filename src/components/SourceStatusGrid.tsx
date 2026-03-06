'use client';

import { SOURCE_LABELS } from '@/lib/labels';
import type { SourceName } from '@/types/events';
import type { SourceStatus } from '@/sources/registry';

export type { SourceStatus };

interface SourceStatusGridProps {
  statuses: SourceStatus[];
}

function statusColor(s: SourceStatus['status']) {
  if (s === 'ok') return 'var(--lumiere)';
  if (s === 'skipped' || s === 'no-data') return 'var(--neutre)';
  return '#c45c5c';
}

export function SourceStatusGrid({ statuses }: SourceStatusGridProps) {
  const list = statuses ?? [];
  const bySource = Object.fromEntries(list.map((s) => [s.source, s]));

  const sources: SourceName[] = [
    'gdelt',
    'usgs',
    'firms',
    'rss',
    'gdacs',
    'reliefweb',
    'weather',
    'cloudflare',
    'lbp-rate',
    'openaq',
    'twitter',
  ];

  return (
    <div className="grid grid-cols-5 gap-1">
      {sources.map((key) => {
        const s = bySource[key] ?? { source: key, status: 'skipped' as const, eventCount: 0 };
        return (
          <div
            key={key}
            className="flex items-center gap-1.5 py-1 px-2 rounded"
            title={s.error ?? `${SOURCE_LABELS[key]}: ${s.eventCount} event${s.eventCount !== 1 ? 's' : ''}`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: statusColor(s.status) }}
            />
            <span className="text-[10px] truncate text-[var(--dark-muted)]">
              {SOURCE_LABELS[key]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
