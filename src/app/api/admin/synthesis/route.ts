/**
 * POST /api/admin/synthesis — Trigger synthesis generation (for cron or manual).
 * Protected by X-Ingest-Secret header matching INGEST_SECRET.
 * Populates Redis cache so GET /api/v2/synthesis returns instantly.
 */
import { NextRequest, NextResponse } from 'next/server';
import { generateSynthesisWithDiagnostics } from '@/worker/synthesis';

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

  const start = Date.now();
  try {
    const diag = await generateSynthesisWithDiagnostics();
    const durationMs = Date.now() - start;

    if (diag.ok) {
      return NextResponse.json({ ok: true, durationMs, cached: true });
    }
    return NextResponse.json(
      { ok: false, durationMs, step: diag.step, error: diag.error },
      { status: 500 }
    );
  } catch (err) {
    const durationMs = Date.now() - start;
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    return NextResponse.json(
      {
        ok: false,
        durationMs,
        step: 'unhandled',
        error: msg,
        ...(stack && { stack: stack.split('\n').slice(0, 5).join('\n') }),
      },
      { status: 500 }
    );
  }
}
