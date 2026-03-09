'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface EventItem {
  id: string;
  title: string;
  occurredAt: string;
  category?: string | null;
}

export function ACLEDMiniMap() {
  const { data } = useSWR<{ data: EventItem[] }>(
    '/api/v2/events?source=acled&limit=50',
    fetcher,
    { refreshInterval: 300_000 }
  );

  const { data: fallbackData } = useSWR<{ data: EventItem[] }>(
    '/api/v2/events?category=armed_conflict&limit=20',
    fetcher,
    { refreshInterval: 300_000 }
  );

  const acledEvents = data?.data ?? [];
  const events = acledEvents.length > 0 ? acledEvents : (fallbackData?.data ?? []);
  const recent = events.slice(0, 3);

  return (
    <div
      className="flex flex-col p-4 min-h-[140px]"
      style={{ background: '#0A0A0A' }}
    >
      <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
        {acledEvents.length > 0 ? 'Incidents ACLED · 30j' : 'Incidents armés'}
      </div>
      <div className="text-[48px] font-light tabular-nums" style={{ color: '#FFFFFF' }}>
        {events.length > 0 ? events.length : '—'}
      </div>
      <div className="text-[11px] mt-1 mb-3" style={{ color: '#666666' }}>
        {events.length > 0 ? 'incidents géolocalisés' : 'données en attente'}
      </div>
      {recent.map((e) => (
        <div
          key={e.id}
          className="text-[12px] leading-snug py-1"
          style={{ color: '#CCCCCC', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
        >
          {e.title.length > 55 ? `${e.title.slice(0, 55)}…` : e.title}
        </div>
      ))}
    </div>
  );
}
