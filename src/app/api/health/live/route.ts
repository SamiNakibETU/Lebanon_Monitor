/**
 * GET /api/health/live — Liveness probe for Railway/Kubernetes.
 * Returns 200 quickly without external calls. Use for deployment healthchecks.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { status: 'ok', timestamp: new Date().toISOString() },
    { status: 200 }
  );
}
