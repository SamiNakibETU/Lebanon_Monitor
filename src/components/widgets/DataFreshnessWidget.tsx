'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface FreshnessItem {
  source: string;
  ageSeconds: number;
  stale: boolean;
  status: string;
}

interface FreshnessData {
  items: FreshnessItem[];
}

export function DataFreshnessWidget() {
  const { data } = useSWR<FreshnessData>('/api/v2/data-freshness', fetcher, { refreshInterval: 60_000 });
  const items = data?.items?.slice(0, 5) ?? [];

  return (
    <div className="flex flex-col p-4" style={{ background: '#0A0A0A' }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
        Data freshness
      </div>
      {items.length === 0 ? (
        <div className="text-[12px]" style={{ color: '#666666' }}>
          —
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((it) => (
            <div
              key={it.source}
              className="text-[12px] flex items-center justify-between"
              style={{ color: it.stale ? '#C62828' : '#FFFFFF' }}
            >
              <span>{it.source}</span>
              <span style={{ color: '#666666' }}>{Math.round(it.ageSeconds / 60)}m</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
