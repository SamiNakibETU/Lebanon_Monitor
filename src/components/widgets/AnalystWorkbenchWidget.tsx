'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface AnalystRow {
  eventId: string;
  title: string;
  occurredAt: string;
  observationCount: number;
  sourceDiversity: number;
  mediaCount: number;
  verificationStatus: string;
}

export function AnalystWorkbenchWidget() {
  const { data } = useSWR<{ items: AnalystRow[] }>(
    '/api/v2/analyst-workbench',
    fetcher,
    { refreshInterval: 180_000 }
  );

  const items = Array.isArray(data?.items) ? data.items.slice(0, 8) : [];

  return (
    <div className="p-4">
      <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
        Event Review Queue
      </div>
      <div className="flex flex-col">
        {items.map((row) => (
          <div key={row.eventId} className="py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="text-[12px] leading-snug" style={{ color: '#FFFFFF' }}>
              {row.title.length > 100 ? `${row.title.slice(0, 100)}...` : row.title}
            </div>
            <div className="text-[10px]" style={{ color: '#666666' }}>
              sources: {row.observationCount} · diversité: {row.sourceDiversity} · media: {row.mediaCount} · {row.verificationStatus}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

