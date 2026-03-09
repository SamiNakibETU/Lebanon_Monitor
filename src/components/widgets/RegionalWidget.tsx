'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface CountryData {
  code: string;
  name: string;
  flag: string;
  eventCount: number;
  events: Array<{
    title: string;
    url: string;
    date: string;
    domain: string;
  }>;
}

export function RegionalWidget() {
  const { data } = useSWR<{ countries: CountryData[] }>(
    '/api/v2/regional',
    fetcher,
    { refreshInterval: 600_000 }
  );

  const countries = data?.countries ?? [];

  return (
    <div className="flex flex-col p-4" style={{ background: '#0A0A0A' }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-3" style={{ color: '#666666' }}>
        Contexte régional · Moyen-Orient
      </div>
      {countries.length === 0 ? (
        <div className="text-[13px]" style={{ color: '#666666' }}>
          Chargement du contexte régional…
        </div>
      ) : (
        <div className="flex flex-col">
          {countries.map((c) => (
            <div
              key={c.code}
              className="py-2"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[13px]" style={{ color: '#FFFFFF' }}>
                  {c.name}
                </span>
                <span className="text-[11px] tabular-nums" style={{ color: '#666666' }}>
                  {c.eventCount} évén.
                </span>
              </div>
              {c.events.length > 0 && (
                <a
                  href={c.events[0].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] leading-snug line-clamp-1 transition-colors"
                  style={{ color: '#888888' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#FFFFFF'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#888888'; }}
                >
                  {c.events[0].title.length > 80 ? c.events[0].title.slice(0, 80) + '…' : c.events[0].title}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
