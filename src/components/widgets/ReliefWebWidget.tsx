'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Report {
  id: number;
  title: string;
  date: string;
  source: string;
  url: string;
  type: string[];
}

export function ReliefWebWidget() {
  const { data } = useSWR<{ count: number; reports: Report[] }>(
    '/api/v2/reliefweb?limit=8',
    fetcher,
    { refreshInterval: 600_000 },
  );

  const reports = data?.reports ?? [];
  const count = data?.count ?? 0;

  return (
    <div className="flex flex-col p-4" style={{ background: '#0A0A0A' }}>
      <div className="flex items-baseline justify-between mb-3">
        <div
          className="text-[11px] uppercase tracking-[0.08em]"
          style={{ color: '#666666' }}
        >
          ReliefWeb — Liban
        </div>
        {count > 0 && (
          <div
            className="text-[11px] tabular-nums"
            style={{ color: '#666666' }}
          >
            {count} rapports
          </div>
        )}
      </div>
      {reports.length === 0 ? (
        <div className="text-[14px]" style={{ color: '#666666' }}>
          Chargement des rapports...
        </div>
      ) : (
        <div className="flex flex-col">
          {reports.map((r) => (
            <a
              key={r.id}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col py-2 transition-colors"
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                color: '#FFFFFF',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div
                className="text-[13px] leading-snug"
                style={{ color: '#FFFFFF' }}
              >
                {r.title.length > 80 ? `${r.title.slice(0, 80)}...` : r.title}
              </div>
              <div
                className="flex gap-2 text-[10px] mt-1"
                style={{ color: '#666666' }}
              >
                <span>{r.source}</span>
                {r.date && (
                  <span>
                    {new Date(r.date).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
