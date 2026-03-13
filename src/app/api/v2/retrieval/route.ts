/**
 * API v2 retrieval — structured multi-object retrieval for analyst/agent use.
 * SQL + filters. No embeddings or vector store.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withClient, isDbConfigured } from '@/db/client';
import { retrievalQuerySchema } from '@/lib/retrieval/query-schema';
import { runRetrieval } from '@/lib/retrieval/search';
import { buildContextPackFromRetrieval } from '@/lib/retrieval/context-pack';

export async function GET(request: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured', code: 500 },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const parsed = retrievalQuerySchema.safeParse({
      q: searchParams.get('q') ?? undefined,
      objectTypes: searchParams.get('objectTypes')?.split(',').filter(Boolean) ?? undefined,
      placeId: searchParams.get('placeId') ?? undefined,
      fromDate: searchParams.get('fromDate') ?? undefined,
      toDate: searchParams.get('toDate') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
      minLat: searchParams.get('minLat') ?? undefined,
      maxLat: searchParams.get('maxLat') ?? undefined,
      minLng: searchParams.get('minLng') ?? undefined,
      maxLng: searchParams.get('maxLng') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query params', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await withClient((client) => runRetrieval(client, parsed.data));
    const contextPack = buildContextPackFromRetrieval(result);

    return NextResponse.json(
      {
        data: result,
        contextPack,
        meta: { query: parsed.data, generatedAt: new Date().toISOString() },
      },
      {
        headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' },
      }
    );
  } catch (err) {
    console.error('Retrieval API error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 500 },
      { status: 500 }
    );
  }
}
