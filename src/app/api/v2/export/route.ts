/**
 * API v2 export — download events as CSV or JSON.
 * Same query params as /api/v2/events; adds format=csv|json.
 */

import { NextResponse } from 'next/server';
import { withClient, isDbConfigured } from '@/db/client';
import { listEvents } from '@/db/repositories/event-repository';
import { getTranslationsForEvents } from '@/db/repositories/event-translation-repository';
import { getObservationCountByEventIds } from '@/db/repositories/event-observation-repository';
import { getSourceTier } from '@/config/source-tiers';
import { z } from 'zod';

const POLITICAL_CATEGORIES = ['political_tension', 'armed_conflict', 'violence', 'displacement'] as const;

const querySchema = z.object({
  format: z.enum(['csv', 'json']).optional().default('json'),
  lang: z.enum(['fr', 'en', 'ar']).optional().default('fr'),
  classification: z.enum(['ombre', 'lumiere', 'neutre']).optional(),
  category: z.string().optional(),
  political: z.enum(['true', 'false']).optional(),
  source: z.string().optional(),
  since: z.string().optional(),
  limit: z.coerce.number().min(1).max(500).optional().default(200),
  offset: z.coerce.number().min(0).optional().default(0),
});

function mapSeverity(score: number | null): string {
  if (score == null) return 'low';
  if (score >= 0.9) return 'critical';
  if (score >= 0.6) return 'high';
  if (score >= 0.3) return 'medium';
  return 'low';
}

function escapeCsvCell(val: unknown): string {
  const s = String(val ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured', code: 500 },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      format: searchParams.get('format') ?? 'json',
      lang: searchParams.get('lang') ?? 'fr',
      classification: searchParams.get('classification') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      political: searchParams.get('political') ?? undefined,
      source: searchParams.get('source') ?? undefined,
      since: searchParams.get('since') ?? undefined,
      limit: searchParams.get('limit') ?? 200,
      offset: searchParams.get('offset') ?? 0,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query params', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { format, lang, classification, category, political, source, since, limit, offset } = parsed.data;
    const fromDate = since ? new Date(since) : undefined;
    const eventTypeFilter = political === 'true' ? undefined : category;
    const eventTypesFilter = political === 'true' ? POLITICAL_CATEGORIES : undefined;

    const { events, total, translations, observationCounts } = await withClient(async (client) => {
      const out = await listEvents(client, {
        polarity: classification,
        event_type: eventTypeFilter ?? undefined,
        event_types: eventTypesFilter,
        source,
        from_date: fromDate,
        limit,
        offset,
      });
      const trans = await getTranslationsForEvents(client, out.events.map((e) => e.id), lang);
      const counts = await getObservationCountByEventIds(client, out.events.map((e) => e.id));
      return { ...out, translations: trans, observationCounts: counts };
    });

    const rows = events.map((e) => {
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
        severity: mapSeverity(e.severity_score),
        occurredAt: e.occurred_at,
        latitude: meta.latitude ?? null,
        longitude: meta.longitude ?? null,
        source,
        sourceTier: getSourceTier(source),
        sourceCount: observationCounts.get(e.id) ?? 1,
        verification_status: e.verification_status,
      };
    });

    const filename = `lebanon-monitor-events-${new Date().toISOString().slice(0, 10)}`;

    if (format === 'csv') {
      const headers = ['id', 'title', 'summary', 'classification', 'category', 'severity', 'occurredAt', 'latitude', 'longitude', 'source', 'sourceTier', 'sourceCount', 'verification_status'];
      const headerRow = headers.join(',');
      const dataRows = rows.map((r) =>
        headers.map((h) => escapeCsvCell((r as Record<string, unknown>)[h])).join(',')
      );
      const csv = [headerRow, ...dataRows].join('\n');
      const bom = '\uFEFF';
      return new NextResponse(bom + csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    return new NextResponse(JSON.stringify({ data: rows, meta: { total, limit, offset } }), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}.json"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('API v2 export error', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 500 },
      { status: 500 }
    );
  }
}
