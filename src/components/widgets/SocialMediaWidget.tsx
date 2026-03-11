'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface SocialItem {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  permalink: string;
  mediaUrls: string[];
  linkedEventId: string | null;
  linkedEventTitle: string | null;
  linkScore: number;
}

export function SocialMediaWidget() {
  const { data } = useSWR<{ items: SocialItem[]; count: number }>(
    '/api/v2/social-feed',
    fetcher,
    { refreshInterval: 180_000 }
  );

  const items = Array.isArray(data?.items) ? data.items.slice(0, 8) : [];

  return (
    <div className="p-4">
      <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
        Social OSINT Feed
      </div>
      <div className="text-[10px] mb-2" style={{ color: '#666666' }}>
        {data?.count ?? 0} captures publiques
      </div>
      <div className="flex flex-col">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.permalink}
            target="_blank"
            rel="noreferrer"
            className="py-2 transition-colors"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#FFFFFF' }}
          >
            <div className="text-[11px] uppercase tracking-[0.08em]" style={{ color: '#666666' }}>
              @{item.author} · {Math.round(item.linkScore * 100)}%
            </div>
            <div className="text-[12px] leading-snug" style={{ color: '#CCCCCC' }}>
              {item.text.length > 140 ? `${item.text.slice(0, 140)}...` : item.text}
            </div>
            <div className="text-[10px]" style={{ color: '#666666' }}>
              media: {item.mediaUrls.length} · {item.linkedEventTitle ?? 'non lié'}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

