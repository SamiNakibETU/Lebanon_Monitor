'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ReliefwebLumiereItem {
  id: string;
  title: string;
  url: string | null;
  source: string | null;
  date: string | null;
}

interface ReliefwebLumiereResponse {
  count: number;
  items: ReliefwebLumiereItem[];
  themeCounts?: {
    recovery: number;
    education: number;
    health: number;
  };
}

export function SolidarityActiveWidget() {
  const { data } = useSWR<ReliefwebLumiereResponse>('/api/v2/reliefweb-lumiere?limit=10', fetcher, {
    refreshInterval: 300_000,
  });

  const count = data?.count ?? 0;
  const items = data?.items ?? [];

  return (
    <div className="flex flex-col p-4" style={{ background: '#F5F2EE' }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#888888' }}>
        Solidarité active
      </div>
      <div className="text-[48px] font-light tabular-nums" style={{ color: '#1A1A1A' }}>
        {count > 0 ? count : '—'}
      </div>
      <div className="text-[11px] mt-1 mb-3" style={{ color: '#888888' }}>
        ReliefWeb · Santé · Education · Reconstruction
      </div>
      {items.slice(0, 3).map((item) => (
        <a
          key={item.id}
          href={item.url ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12px] leading-snug py-1 transition-colors"
          style={{ color: '#1A1A1A', borderBottom: '1px solid #E0DCD7' }}
        >
          {item.title.length > 70 ? `${item.title.slice(0, 70)}…` : item.title}
        </a>
      ))}
    </div>
  );
}

