'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const REFOREST_KEYWORDS = [
  'reforestation', 'reboisement', 'replant', 'hectares', 'hectare',
  'arbres', 'trees', 'forest', 'forêt', 'reforester', 'planter',
];

function extractHectares(text: string): number[] {
  const nums: number[] = [];
  const re = /(\d+(?:[.,]\d+)?)\s*(?:ha|hectares?|hectare)/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const n = parseFloat(m[1].replace(',', '.'));
    if (!Number.isNaN(n)) nums.push(n);
  }
  const re2 = /(\d+)\s*(?:ha|hectares?)/gi;
  while ((m = re2.exec(text)) !== null) {
    const n = parseInt(m[1], 10);
    if (!Number.isNaN(n) && !nums.includes(n)) nums.push(n);
  }
  return nums;
}

interface EventItem {
  id: string;
  title: string;
  summary?: string | null;
}

export function ReforestationWidget() {
  const { data } = useSWR<{ data: EventItem[] }>(
    '/api/v2/events?classification=lumiere&limit=100',
    fetcher,
    { refreshInterval: 300_000 }
  );

  const events = Array.isArray(data?.data) ? data.data : [];
  const related = events.filter((e) => {
    const t = ((e.title ?? '') + ' ' + (e.summary ?? '')).toLowerCase();
    return REFOREST_KEYWORDS.some((kw) => t.includes(kw));
  });

  const allHectares = related.flatMap((e) =>
    extractHectares((e.title ?? '') + ' ' + (e.summary ?? ''))
  );
  const totalHa = allHectares.length > 0
    ? Math.round(allHectares.reduce((a, b) => a + b, 0))
    : null;

  return (
    <div className="flex flex-col p-4" style={{ background: '#F5F2EE' }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#888888' }}>
        Reforestation
      </div>
      <div className="text-[48px] font-light tabular-nums" style={{ color: '#1A1A1A' }}>
        {totalHa != null ? totalHa.toLocaleString() : related.length > 0 ? related.length : '—'}
      </div>
      <div className="text-[11px] mt-1" style={{ color: '#888888' }}>
        {totalHa != null ? 'hectares (estim.)' : related.length > 0 ? 'projets repérés' : 'hectares replantés'}
      </div>
    </div>
  );
}
