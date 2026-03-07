'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface PolymarketItem {
  id: string;
  question: string;
  slug: string;
  yesProb: number;
  noProb: number;
  eventSlug: string;
  volume?: number;
}

export function PolymarketWidget() {
  const { data, error } = useSWR<{ markets: PolymarketItem[] }>(
    '/api/v2/polymarket',
    fetcher,
    { refreshInterval: 120_000 }
  );

  const markets = data?.markets ?? [];

  return (
    <div className="flex flex-col h-full min-h-[140px]">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span
          className="text-[10px] uppercase tracking-widest"
          style={{ color: '#666666' }}
        >
          Polymarket · Liban
        </span>
      </div>
      <div
        className="flex-1 overflow-y-auto min-h-[100px]"
        style={{ scrollbarWidth: 'thin' }}
      >
        {error ? (
          <div
            className="flex flex-col items-center gap-2 p-2"
            style={{ color: '#666666' }}
          >
            <span className="text-[10px]">Marchés indisponibles</span>
          </div>
        ) : markets.length === 0 ? (
          <div
            className="flex flex-col items-center gap-2 p-2"
            style={{ color: '#666666' }}
          >
            <span className="text-[10px]">Chargement…</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {markets.map((m) => (
              <a
                key={m.id}
                href={`https://polymarket.com/event/${m.eventSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block no-underline"
              >
                <div
                  className="text-[10px] leading-tight mb-1 line-clamp-2"
                  style={{ color: '#E0E0E0' }}
                >
                  {m.question}
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.1)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${m.yesProb * 100}%`,
                        background: 'linear-gradient(90deg, #E53935, #C62828)',
                      }}
                    />
                  </div>
                  <span
                    className="text-[10px] tabular-nums shrink-0"
                    style={{ color: '#9E9E9E', minWidth: 32 }}
                  >
                    {Math.round(m.yesProb * 100)}%
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
