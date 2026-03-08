/**
 * GET /api/v2/reforestation-stats — Hectares & project count from lumiere events.
 */
import { NextResponse } from 'next/server';
import { isDbConfigured } from '@/db/client';
import { withClient } from '@/db/client';

const REFOREST_KEYWORDS = [
  'reforestation',
  'reboisement',
  'replant',
  'hectares',
  'hectare',
  'arbres',
  'trees',
  'forest',
  'forêt',
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

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ hectares: null, projectCount: 0 }, { headers: { 'Cache-Control': 's-maxage=300' } });
  }
  try {
    const { events } = await withClient(async (client) => {
      const out = await client.query<{ canonical_title: string; canonical_summary: string | null; metadata: unknown }>(
        `SELECT canonical_title, canonical_summary, metadata FROM event 
         WHERE is_active = true AND polarity_ui = 'lumiere' 
         ORDER BY occurred_at DESC NULLS LAST LIMIT 100`
      );
      return { events: out.rows };
    });
    const related = events.filter((e) => {
      const t = ((e.canonical_title ?? '') + ' ' + (e.canonical_summary ?? '') + ' ' + JSON.stringify(e.metadata ?? {})).toLowerCase();
      return REFOREST_KEYWORDS.some((kw) => t.includes(kw));
    });
    const allHectares = related.flatMap((e) =>
      extractHectares((e.canonical_title ?? '') + ' ' + (e.canonical_summary ?? '') + ' ' + JSON.stringify(e.metadata ?? {}))
    );
    const totalHa = allHectares.length > 0 ? Math.round(allHectares.reduce((a, b) => a + b, 0)) : null;
    return NextResponse.json(
      { hectares: totalHa, projectCount: related.length },
      { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' } }
    );
  } catch {
    return NextResponse.json({ hectares: null, projectCount: 0 }, { headers: { 'Cache-Control': 's-maxage=60' } });
  }
}
