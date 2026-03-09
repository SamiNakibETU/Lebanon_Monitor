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

function formatVolume(v?: number): string {
  if (!v) return '';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function probColor(prob: number): string {
  if (prob >= 0.7) return '#C62828';
  if (prob >= 0.4) return '#E65100';
  if (prob >= 0.2) return '#F9A825';
  return '#2E7D32';
}

export function PolymarketWidget() {
  const { data, error } = useSWR<{ markets: PolymarketItem[] }>(
    '/api/v2/polymarket',
    fetcher,
    { refreshInterval: 120_000 }
  );

  const markets = data?.markets ?? [];
  const isLoading = !data && !error;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: '#666666' }}>
          Marchés prédictifs · Géopolitique
        </span>
        {markets.length > 0 && (
          <span className="text-[10px] tabular-nums" style={{ color: '#666666' }}>
            {markets.length} marchés
          </span>
        )}
      </div>

      {error ? (
        <div className="text-[11px]" style={{ color: '#666666' }}>
          Marchés indisponibles
        </div>
      ) : isLoading ? (
        <div className="text-[11px]" style={{ color: '#666666' }}>
          Chargement des marchés…
        </div>
      ) : markets.length === 0 ? (
        <div className="text-[11px]" style={{ color: '#666666' }}>
          Aucun marché pertinent
        </div>
      ) : (
        <div className="flex flex-col">
          {markets.map((m) => {
            const pct = Math.round(m.yesProb * 100);
            const color = probColor(m.yesProb);
            return (
              <a
                key={m.id}
                href={`https://polymarket.com/event/${m.eventSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block py-2.5 transition-colors"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <span className="text-[12px] leading-snug flex-1" style={{ color: '#E0E0E0' }}>
                    {m.question}
                  </span>
                  <span
                    className="text-[16px] font-light tabular-nums shrink-0"
                    style={{ color }}
                  >
                    {pct}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div
                      className="h-full transition-all"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                  {m.volume != null && m.volume > 0 && (
                    <span className="text-[9px] tabular-nums shrink-0" style={{ color: '#666666' }}>
                      Vol. {formatVolume(m.volume)}
                    </span>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
