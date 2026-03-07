/**
 * Single event by ID — translations, observations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withClient } from '@/db/client';
import { getEventById } from '@/db/repositories/event-repository';
import { getEventTranslations } from '@/db/repositories/event-translation-repository';
import type { Lang } from '@/db/repositories/event-translation-repository';

function mapSeverityScore(score: number | null): string {
  if (score == null) return 'low';
  if (score >= 0.9) return 'critical';
  if (score >= 0.6) return 'high';
  if (score >= 0.3) return 'medium';
  return 'low';
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: 'Database not configured', code: 500 },
      { status: 500 }
    );
  }

  const { id } = await params;
  const lang = (req.nextUrl.searchParams.get('lang') ?? 'fr') as Lang;

  try {
    const { event, translations, observations } = await withClient(async (client) => {
      const event = await getEventById(client, id);
      if (!event) return { event: null, translations: [], observations: [] };

      const translations = await getEventTranslations(client, id);
      const obsResult = await client.query(
        `SELECT eo.observed_title, eo.observed_at, si.source_name
         FROM event_observation eo
         JOIN source_item si ON si.id = eo.source_item_id
         WHERE eo.event_id = $1
         ORDER BY eo.observed_at DESC NULLS LAST`,
        [id]
      );

      return {
        event,
        translations,
        observations: obsResult.rows,
      };
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found', code: 404 }, { status: 404 });
    }

    const transByLang = new Map(translations.map((t) => [t.language, t.title ?? event.canonical_title]));
    const title = transByLang.get(lang) ?? event.canonical_title;
    const meta = (event.metadata ?? {}) as Record<string, unknown>;

    return NextResponse.json(
      {
        id: event.id,
        title,
        summary: event.canonical_summary,
        classification: event.polarity_ui,
        confidence: event.confidence_score ?? 0,
        category: event.event_type,
        severity: mapSeverityScore(event.severity_score),
        occurredAt: event.occurred_at,
        latitude: meta.latitude ?? null,
        longitude: meta.longitude ?? null,
        sources: observations.map((o: { source_name: string }) => o.source_name),
        translations: Object.fromEntries(translations.map((t) => [t.language, t.title])),
      },
      {
        headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
      }
    );
  } catch (err) {
    console.error('API v2 event by id error', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 500 },
      { status: 500 }
    );
  }
}
