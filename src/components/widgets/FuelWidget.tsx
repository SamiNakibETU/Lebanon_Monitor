'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface FuelData {
  benzin95: number;
  benzin98: number;
  diesel: number;
  currency: string;
  perLiters: number;
  updated: string;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR').format(price);
}

export function FuelWidget() {
  const { data } = useSWR<FuelData>('/api/v2/fuel', fetcher, {
    refreshInterval: 3600_000,
  });

  return (
    <div className="flex flex-col p-4" style={{ background: '#0A0A0A' }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
        Prix carburant
      </div>
      <div className="text-[48px] font-light tabular-nums" style={{ color: '#FFFFFF' }}>
        {data ? formatPrice(data.benzin95) : '—'}
      </div>
      <div className="text-[11px] mt-1" style={{ color: '#666666' }}>
        {data ? `Benzin 95 · ${data.perLiters}L · ${data.currency}` : 'LBP (benzin, diesel)'}
      </div>
      {data && (
        <div className="flex gap-4 mt-3 text-[11px]" style={{ color: '#666666' }}>
          <span>98: {formatPrice(data.benzin98)}</span>
          <span>Diesel: {formatPrice(data.diesel)}</span>
        </div>
      )}
      {data?.updated && (
        <div className="text-[10px] mt-2" style={{ color: '#444444' }}>
          Mis à jour: {data.updated}
        </div>
      )}
    </div>
  );
}
