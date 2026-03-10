/**
 * POST /api/admin/ingest — Trigger one pipeline run (for cron-job.org, etc.)
 * Protected by X-Ingest-Secret header matching INGEST_SECRET env var.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runPipeline } from '@/worker/pipeline';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 min for pipeline
let activeRun: Promise<Awaited<ReturnType<typeof runPipeline>>> | null = null;

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-ingest-secret') ?? req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const expected = process.env.INGEST_SECRET;
  const { searchParams } = new URL(req.url);
  const asyncMode = searchParams.get('async') === '1' || searchParams.get('mode') === 'cron';
  const cronMode = searchParams.get('mode') === 'cron';

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
    if (activeRun) {
      if (asyncMode) {
        return NextResponse.json({ ok: true, accepted: false, running: true });
      }
      const runningResult = await activeRun;
      return NextResponse.json({ ok: true, reused: true, ...runningResult });
    }

    const run = runPipeline({
      skipLlmClassification: cronMode,
      maxLlmItems: cronMode ? 0 : Number(process.env.GROQ_CLASSIFY_MAX_ITEMS ?? 15),
      maxTranslations: cronMode ? Number(process.env.GROQ_TRANSLATE_MAX_EVENTS_PER_RUN_CRON ?? 8) : Number(process.env.GROQ_TRANSLATE_MAX_EVENTS_PER_RUN ?? 20),
      skipCluster: cronMode,
      runIndicators: true,
    });
    activeRun = run.finally(() => {
      activeRun = null;
    });

    if (asyncMode) {
      return NextResponse.json({
        ok: true,
        accepted: true,
        mode: cronMode ? 'cron' : 'async',
      });
    }

    const start = Date.now();
    const result = await activeRun;
    const durationMs = Date.now() - start;
    return NextResponse.json({
      ok: true,
      durationMs,
      eventsCreated: result.eventsCreated,
      eventsUpdated: result.eventsUpdated,
      rawCount: result.rawCount,
      newItemsCount: result.newItemsCount,
      sourcesRun: result.sourcesRun,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
