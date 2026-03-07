/**
 * API v2 search — full-text search on events.
 */

import { NextResponse } from 'next/server';
import { withClient } from '@/db/client';
import { searchEvents } from '@/db/repositories/event-repository';
import { getTranslationsForEvents } from '@/db/repositories/event-translation-repository';
import { getObservationCountByEventIds } from '@/db/repositories/event-observation-repository';
import { getSourceTier } from '@/config/source-tiers';
import { z } from 'zod';

const querySchema = z.object({
  q: z.string().min(1).max(200),
  lang: z.enum(['fr', 'en', 'ar']).optional().default('fr'),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
});

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: 'Database not configured', code: 500 },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      q: searchParams.get('q') ?? '',
      lang: searchParams.get('lang') ?? 'fr',
      limit: searchParams.get('limit') ?? 20,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query params', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { q, lang, limit } = parsed.data;

    const { events, total, translations, observationCounts } = await withClient(async (client) => {
      const out = await searchEvents(client, q, limit);
      const trans = await getTranslationsForEvents(client, out.events.map((e) => e.id), lang);
      const counts = await getObservationCountByEventIds(client, out.events.map((e) => e.id));
      return { ...out, translations: trans, observationCounts: counts };
    });

    const data = events.map((e) => {
      const translatedTitle = translations.get(e.id) ?? e.canonical_title;
      const meta = (e.metadata ?? {}) as Record<string, unknown>;
      const source = (meta.source as string | null) ?? null;
      return {
        id: e.id,
        title: translatedTitle,
        summary: e.canonical_summary,
        classification: e.polarity_ui,
        confidence: e.confidence_score,
        category: e.event_type,
        occurredAt: e.occurred_at,
        latitude: meta.latitude ?? null,
        longitude: meta.longitude ?? null,
        source,
        sourceTier: getSourceTier(source),
        sourceCount: observationCounts.get(e.id) ?? 1,
        verification_status: e.verification_status,
      };
    });

    return NextResponse.json(
      { data, meta: { total, limit } },
      {
        headers: {
          'Cache-Control': 's-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (err) {
    console.error('API v2 search error', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 500 },
      { status: 500 }
    );
  }
}
