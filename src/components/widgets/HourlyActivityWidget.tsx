'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface TimelineItem {
  hour: string;
  count: number;
  ombre: number;
  lumiere: number;
}

interface TimelineEvent {
  id: string;
  title: string;
  occurredAt: string;
}

export function HourlyActivityWidget() {
  const { data } = useSWR<TimelineItem[]>('/api/v2/timeline', fetcher, {
    refreshInterval: 120_000,
  });
  const { data: eventRes } = useSWR<{ data: TimelineEvent[] }>(
    '/api/v2/events?limit=120&political=true',
    fetcher,
    { refreshInterval: 120_000 }
  );

  const points = Array.isArray(data) ? data : [];
  const events = Array.isArray(eventRes?.data) ? eventRes.data : [];
  const byHour = new Map<string, string[]>();
  for (const e of events) {
    const h = String(new Date(e.occurredAt).getHours()).padStart(2, '0');
    const current = byHour.get(h) ?? [];
    if (current.length < 3) current.push(e.title);
    byHour.set(h, current);
  }
  const top = [...points]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((p) => ({
      ...p,
      dominant: p.ombre > p.lumiere ? 'ombre' : p.lumiere > p.ombre ? 'lumiere' : 'mixed',
    }));
  const maxCount = Math.max(1, ...top.map((p) => p.count));

  return (
    <div className="flex flex-col p-4" style={{ background: '#0A0A0A' }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-3" style={{ color: '#666666' }}>
        Activité horaire · 24h
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
              className="py-2"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
            >
              <div className="flex items-center justify-between">
                <div className="text-[12px]" style={{ color: '#FFFFFF' }}>
                  {p.hour}h
                </div>
                <div className="text-[11px]" style={{ color: '#888888' }}>
                  {p.count} événements
                </div>
              </div>
              <div className="mt-2 h-2 w-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full"
                  style={{
                    width: `${Math.max(2, (p.count / maxCount) * 100)}%`,
                    background: p.dominant === 'ombre' ? '#C62828' : p.dominant === 'lumiere' ? '#2E7D32' : '#888888',
                  }}
                />
              </div>
              <div className="text-[11px] mt-1" style={{ color: '#888888' }}>
                {p.ombre} ombre / {p.lumiere} lumière
              </div>
              {(byHour.get(p.hour) ?? []).slice(0, 2).map((title, idx) => (
                <div key={`${p.hour}-${idx}`} className="text-[10px] mt-1" style={{ color: '#666666' }}>
                  {title.length > 85 ? `${title.slice(0, 85)}…` : title}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
