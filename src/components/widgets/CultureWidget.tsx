'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const CULTURE_RE = /\b(festival|concert|exposition|th[eé][aâ]tre|cin[eé]ma|musique|music|vernissage|spectacle|danse?)\b/i;

interface EventItem {
  id: string;
  title: string;
  occurredAt: string;
  category?: string | null;
  source?: string | null;
}

export function CultureWidget() {
  const { data } = useSWR<{ data: EventItem[] }>(
    '/api/v2/events?classification=lumiere&limit=30',
    fetcher,
    { refreshInterval: 300_000 }
  );

  const events = Array.isArray(data?.data) ? data.data : [];
  const cultural = events
    .filter((e) => e.category === 'cultural_event' || CULTURE_RE.test(e.title))
    .slice(0, 5);

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
