/**
 * POST /api/admin/synthesis — Trigger synthesis generation (for cron or manual).
 * Protected by X-Ingest-Secret header matching INGEST_SECRET.
 * Populates Redis cache so GET /api/v2/synthesis returns instantly.
 */
import { NextRequest, NextResponse } from 'next/server';
import { generateSynthesis } from '@/worker/synthesis';

export const dynamic = 'force-dynamic';
export const maxDuration = 90;

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-ingest-secret') ?? req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const expected = process.env.INGEST_SECRET;

  if (!expected) {
    return NextResponse.json({ error: 'INGEST_SECRET not configured' }, { status: 500 });
  }
  if (secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const start = Date.now();
    const result = await generateSynthesis();
    const durationMs = Date.now() - start;
    if (result) {
      return NextResponse.json({ ok: true, durationMs, cached: true });
    }
    return NextResponse.json({ ok: false, durationMs, error: 'generateSynthesis returned null' }, { status: 500 });
  } catch (err) {
    console.error('Admin synthesis error', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
