'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const CULTURE_KEYWORDS = [
  'festival', 'concert', 'culture', 'agenda', 'exposition', 'exhibition',
  'théâtre', 'theater', 'cinéma', 'film', 'music', 'art', 'concert',
  'spectacle', 'dance', 'danse', 'vernissage', 'conférence', 'workshop',
];

function isCultural(title: string): boolean {
  const lower = title.toLowerCase();
  return CULTURE_KEYWORDS.some((kw) => lower.includes(kw));
}

interface EventItem {
  id: string;
  title: string;
  occurredAt: string;
  source?: string | null;
}

export function CultureWidget() {
  const { data } = useSWR<{ data: EventItem[] }>(
    '/api/v2/events?source=rss&limit=30',
    fetcher,
    { refreshInterval: 300_000 }
  );

  const events = Array.isArray(data?.data) ? data.data : [];
  const cultural = events.filter((e) => isCultural(e.title)).slice(0, 5);

  return (
    <div className="flex flex-col p-4" style={{ background: '#F5F2EE' }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#888888' }}>
        Agenda culturel
      </div>
      <div className="flex flex-col gap-2">
        {cultural.length === 0 ? (
          <div className="text-[14px] leading-relaxed" style={{ color: '#888888' }}>
            Aucun événement à venir
          </div>
        ) : (
          cultural.map((e) => (
            <a
              key={e.id}
              href={`/event/${e.id}`}
              className="text-[13px] leading-snug transition-colors hover:underline"
              style={{ color: '#1A1A1A' }}
            >
              {e.title.length > 60 ? `${e.title.slice(0, 60)}…` : e.title}
            </a>
          ))
        )}
      </div>
    </div>
  );
}
