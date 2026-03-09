'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface WBProject {
  id: string;
  name: string;
  amount: number;
  status: string;
  sector?: string;
  progressPct?: number | null;
  governorate?: string;
}

export function ReconstructionWidget() {
  const { data } = useSWR<{ projects: WBProject[]; total: number }>(
    '/api/v2/reconstruction',
    fetcher,
    { refreshInterval: 3600_000 }
  );

  const total = data?.total ?? 0;
  const projects = data?.projects ?? [];

  return (
    <div className="flex flex-col p-4" style={{ background: '#F5F2EE' }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#888888' }}>
        Projets reconstruction
      </div>
      <div className="text-[48px] font-light tabular-nums" style={{ color: '#1A1A1A' }}>
        {total > 0 ? total : '—'}
      </div>
      <div className="text-[11px] mt-1 mb-3" style={{ color: '#888888' }}>
        {total > 0 ? 'projets World Bank · Liban' : 'World Bank — données en attente'}
      </div>
      {projects.slice(0, 3).map((p) => (
        <div
          key={p.id}
          className="text-[12px] leading-snug py-1"
          style={{ color: '#1A1A1A', borderBottom: '1px solid #E0DCD7' }}
        >
          <div>{p.name.length > 55 ? `${p.name.slice(0, 55)}…` : p.name}</div>
          <div className="text-[10px] mt-1" style={{ color: '#888888' }}>
            {(p.sector ?? 'N/A').slice(0, 28)}
            {p.governorate ? ` · ${p.governorate}` : ''}
            {typeof p.progressPct === 'number' ? ` · ${Math.round(p.progressPct)}%` : ''}
          </div>
        </div>
      ))}
    </div>
  );
}
