'use client';

import Link from 'next/link';

export interface EpisodeBadgeProps {
  id: string;
  label: string | null;
  eventCount: number;
  status?: 'open' | 'closed';
}

export function EpisodeBadge({ id, label, eventCount, status }: EpisodeBadgeProps) {
  return (
    <Link
      href={`/episode/${id}`}
      className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.04em] transition-colors duration-150 hover:text-[#FFF]"
      style={{ color: '#666' }}
      title={label ?? 'Episode'}
    >
      <span>Episode</span>
      <span className="truncate max-w-[120px]">{label ?? id.slice(0, 8)}</span>
      {eventCount > 1 && <span>({eventCount})</span>}
      {status === 'open' && (
        <span className="text-[9px]" style={{ color: '#43A047' }}>•</span>
      )}
    </Link>
  );
}
