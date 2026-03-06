'use client';

import { SOURCE_LABELS } from '@/lib/labels';
import type { SourceName } from '@/types/events';
import type { SourceStatus } from './SourceStatusGrid';

interface SourceStatusCompactProps {
  statuses: SourceStatus[];
}

function statusColor(s: SourceStatus['status']): string {
  if (s === 'ok') return '#3d6b4a';
  if (s === 'skipped') return '#5c5c5c';
  return '#c45c5c';
}

export function SourceStatusCompact({ statuses }: SourceStatusCompactProps) {
  const bySource = Object.fromEntries((statuses ?? []).map((s) => [s.source, s]));

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
    <div
      className="flex flex-wrap gap-1"
      title="État des sources (vert=ok, gris=skipped, rouge=erreur)"
    >
      {sources.map((key) => {
        const s = bySource[key] ?? { source: key, status: 'skipped' as const, eventCount: 0 };
        return (
          <span
            key={key}
            className="w-2 h-2 rounded-full shrink-0"
            style={{
              background: statusColor(s.status),
              opacity: s.status === 'ok' ? 1 : 0.6,
            }}
            title={`${SOURCE_LABELS[key]}: ${s.status} (${s.eventCount})`}
          />
        );
      })}
    </div>
  );
}
