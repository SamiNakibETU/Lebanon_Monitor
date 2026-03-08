'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface UnifilItem {
  title: string;
  url: string;
}

export function UNIFILWidget() {
  const { data } = useSWR<{ items: UnifilItem[] }>(
    '/api/v2/unifil',
    fetcher,
    { refreshInterval: 3600_000 }
  );

  const items = data?.items ?? [];

  return (
    <div className="flex flex-col p-4" style={{ background: '#0A0A0A' }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
        UNIFIL
      </div>
      <div className="flex flex-col gap-2">
        {items.length === 0 ? (
          <div className="text-[14px] leading-relaxed" style={{ color: '#666666' }}>
            Dernier communiqué — à venir
          </div>
        ) : (
          items.map((item) => (
            <a
              key={item.url}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] leading-snug transition-colors hover:text-[#FFFFFF]"
              style={{ color: '#AAAAAA' }}
            >
              {item.title.length > 70 ? `${item.title.slice(0, 70)}…` : item.title}
            </a>
          ))
        )}
      </div>
    </div>
  );
}
