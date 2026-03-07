/**
 * POST /api/admin/ingest — Trigger one pipeline run (for cron-job.org, etc.)
 * Protected by X-Ingest-Secret header matching INGEST_SECRET env var.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runPipeline } from '@/worker/pipeline';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 min for pipeline

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-ingest-secret') ?? req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const expected = process.env.INGEST_SECRET;

  if (!expected) {
    return NextResponse.json(
      { error: 'INGEST_SECRET not configured. Set it in Railway Variables.' },
      { status: 500 }
    );
  }

  if (secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const start = Date.now();
    await runPipeline();
    const duration = Date.now() - start;
    return NextResponse.json({ ok: true, durationMs: duration });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
