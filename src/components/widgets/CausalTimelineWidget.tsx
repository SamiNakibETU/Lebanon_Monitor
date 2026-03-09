'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface TimelineItem {
  hour: string;
  count: number;
  ombre: number;
  lumiere: number;
}

export function CausalTimelineWidget() {
  const { data } = useSWR<TimelineItem[]>('/api/v2/timeline', fetcher, {
    refreshInterval: 120_000,
  });

  const points = Array.isArray(data) ? data : [];
  const top = [...points]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((p) => ({
      ...p,
      dominant: p.ombre > p.lumiere ? 'ombre' : p.lumiere > p.ombre ? 'lumiere' : 'mixed',
    }));

  return (
    <div className="flex flex-col p-4" style={{ background: '#0A0A0A' }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-3" style={{ color: '#666666' }}>
        Timeline causale · 24h
      </div>
      {top.length === 0 ? (
        <div className="text-[13px]" style={{ color: '#666666' }}>
          Analyse en cours…
        </div>
      ) : (
        <div className="flex flex-col">
          {top.map((p) => (
            <div
              key={p.hour}
              className="flex items-center justify-between py-2"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
            >
              <div className="text-[12px]" style={{ color: '#FFFFFF' }}>
                {p.hour}h
              </div>
              <div className="text-[11px]" style={{ color: '#888888' }}>
                {p.count} événements · {p.ombre} ombre / {p.lumiere} lumière
              </div>
              <div
                className="text-[10px] uppercase"
                style={{ color: p.dominant === 'ombre' ? '#C62828' : p.dominant === 'lumiere' ? '#2E7D32' : '#888888' }}
              >
                {p.dominant}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

