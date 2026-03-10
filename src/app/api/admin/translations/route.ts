import { NextRequest, NextResponse } from 'next/server';
import { withClient, isDbConfigured } from '@/db/client';
import { translateAndStore } from '@/worker/translate';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-ingest-secret') ?? req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const expected = process.env.INGEST_SECRET;

  if (!expected) {
    return NextResponse.json({ error: 'INGEST_SECRET not configured' }, { status: 500 });
  }
  if (secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const limit = Math.min(Math.max(Number(body.limit ?? 120), 1), 300);

  const candidates = await withClient(async (client) => {
    const { rows } = await client.query<{ id: string; canonical_title: string | null; canonical_summary: string | null }>(
      `SELECT e.id, e.canonical_title, e.canonical_summary
       FROM event e
       WHERE e.is_active = true
         AND e.canonical_title IS NOT NULL
         AND (
           NOT EXISTS (
             SELECT 1
             FROM event_translation t
             WHERE t.event_id = e.id AND t.language = 'fr' AND t.title IS NOT NULL
           )
           OR NOT EXISTS (
             SELECT 1
             FROM event_translation t
             WHERE t.event_id = e.id AND t.language = 'en' AND t.title IS NOT NULL
           )
         )
       ORDER BY e.occurred_at DESC
       LIMIT $1`,
      [limit]
    );
    return rows;
  });

  let processed = 0;
  let failed = 0;
  for (const row of candidates) {
    if (!row.canonical_title) continue;
    try {
      await translateAndStore(row.id, row.canonical_title, row.canonical_summary);
      processed++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({
    ok: true,
    requested: limit,
    selected: candidates.length,
    processed,
    failed,
  });
}
