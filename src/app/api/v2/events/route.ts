/**
 * API v2 events — read from PostgreSQL.
 */

import { NextResponse } from 'next/server';
import { withClient, isDbConfigured } from '@/db/client';
import { listEvents } from '@/db/repositories/event-repository';
import { getTranslationPayloadsForEvents } from '@/db/repositories/event-translation-repository';
import { getObservationCountByEventIds } from '@/db/repositories/event-observation-repository';
import { getSourceTier } from '@/config/source-tiers';
import { isProbablyGarbled, normalizeText } from '@/lib/text-normalize';
import { buildGeoQualityFromEvent } from '@/lib/api/geo-quality';
import { z } from 'zod';

/** Event types considered "political" for the political feed. */
const POLITICAL_CATEGORIES = ['political_tension', 'armed_conflict', 'violence', 'displacement'] as const;
const REGION_KEYWORDS = /(lebanon|liban|beirut|tripoli|sidon|saida|tyre|sour|baalbek|bekaa|nabatiyeh|south lebanon|israel|syria|iran|gaza|palestine)/i;

const querySchema = z.object({
  lang: z.enum(['fr', 'en', 'ar']).optional().default('fr'),
  classification: z.enum(['ombre', 'lumiere', 'neutre']).optional(),
  category: z.string().optional(),
  political: z.enum(['true', 'false']).optional(),
  severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  source: z.string().optional(),
  since: z.string().optional(),
  minConfidence: z.coerce.number().min(0).max(1).optional(),
  geoPrecision: z.enum(['exact_point', 'neighborhood', 'city', 'district', 'governorate', 'country', 'inferred', 'unknown']).optional(),
  multiSourceOnly: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0),
});

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
      lang: searchParams.get('lang') ?? 'fr',
      classification: searchParams.get('classification') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      political: searchParams.get('political') ?? undefined,
      severity: searchParams.get('severity') ?? undefined,
      source: searchParams.get('source') ?? undefined,
      since: searchParams.get('since') ?? undefined,
      minConfidence: searchParams.get('minConfidence') ?? undefined,
      geoPrecision: searchParams.get('geoPrecision') ?? undefined,
      multiSourceOnly: searchParams.get('multiSourceOnly') ?? undefined,
      limit: searchParams.get('limit') ?? 50,
      offset: searchParams.get('offset') ?? 0,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query params', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { lang, classification, category, political, source, since, minConfidence, geoPrecision, multiSourceOnly, limit, offset } = parsed.data;

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
        min_confidence: minConfidence,
        geo_precision: geoPrecision,
        multi_source_only: multiSourceOnly === 'true',
        limit,
        offset,
      });
      const trans = await getTranslationPayloadsForEvents(client, out.events.map((e) => e.id), lang);
      const counts = await getObservationCountByEventIds(client, out.events.map((e) => e.id));
      return { ...out, translations: trans, observationCounts: counts };
    });

    const data = events.map((e) => {
      const translated = translations.get(e.id);
      const translatedTitle = normalizeText(translated?.title ?? e.canonical_title);
      const translatedSummary = normalizeText(translated?.summary ?? e.canonical_summary ?? '') || null;
      const meta = (e.metadata ?? {}) as Record<string, unknown>;
      const source = (meta.source as string | null) ?? null;
      const evidence =
        meta.evidence && typeof meta.evidence === 'object'
          ? (meta.evidence as Record<string, unknown>)
          : null;
      return {
        id: e.id,
        title: translatedTitle,
        summary: translatedSummary,
        classification: e.polarity_ui,
        confidence: e.confidence_score,
        category: e.event_type,
        severity: mapSeverityScore(e.severity_score),
        occurredAt: e.occurred_at,
        latitude: meta.latitude ?? null,
        longitude: meta.longitude ?? null,
        geoPrecision: e.geo_precision ?? (meta.geoPrecision as string | null) ?? 'unknown',
        geoQuality: buildGeoQualityFromEvent(e),
        resolvedPlaceName: (meta.resolvedPlaceName as string | null) ?? null,
        source,
        eventSource: source,
        sourceTier: getSourceTier(source),
        verificationStatus: e.verification_status,
        translationStatus: (meta.translationStatus as string | null) ?? 'unknown',
        sourceCount: observationCounts.get(e.id) ?? 1,
        evidence: evidence ?? {
          sourceCount: observationCounts.get(e.id) ?? 1,
          sourceDiversity: 1,
          verificationLevel: e.verification_status === 'verified' ? 'high' : e.verification_status === 'partially_verified' ? 'medium' : 'low',
          verificationStatus: e.verification_status,
        },
        confidence_lumiere: typeof meta.confidenceLumiere === 'number' ? meta.confidenceLumiere : null,
        impact_lumiere: typeof meta.impactLumiere === 'number' ? meta.impactLumiere : null,
        verification_status: (meta.verificationStatus as string | null) ?? e.verification_status,
      };
    })
      .filter((e) => !isProbablyGarbled(e.title))
      .filter((e) => isRelevantEvent(e))
      .filter((e, idx, arr) => dedupeByTitleWithinWindow(e, idx, arr));

    return NextResponse.json(
      {
        data,
        meta: { total, limit, offset },
      },
      {
        headers: {
          'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (err) {
    console.error('API v2 events error', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 500 },
      { status: 500 }
    );
  }
}

function isRelevantEvent(event: { title: string; summary: string | null; eventSource?: string | null; category: string | null }): boolean {
  const source = (event.eventSource ?? '').toLowerCase();
  if (!['gdelt', 'rss'].includes(source)) return true;
  const text = `${event.title} ${event.summary ?? ''}`;
  if (REGION_KEYWORDS.test(text)) return true;
  return [
    'armed_conflict', 'political_tension', 'violence', 'displacement',
    'reconstruction', 'solidarity', 'cultural_event',
    'aid_delivery_verified', 'service_restoration', 'cultural_resilience', 'sports_cohesion', 'civil_society_mobilization',
  ].includes(event.category ?? '');
}

function dedupeByTitleWithinWindow(
  current: { title: string; occurredAt: Date | string | null },
  idx: number,
  arr: Array<{ title: string; occurredAt: Date | string | null }>
): boolean {
  const currentKey = normalizeTitle(current.title);
  const currentTs = current.occurredAt ? new Date(current.occurredAt).getTime() : 0;
  for (let i = 0; i < idx; i++) {
    const prev = arr[i]!;
    if (normalizeTitle(prev.title) !== currentKey) continue;
    const prevTs = prev.occurredAt ? new Date(prev.occurredAt).getTime() : 0;
    if (!prevTs || !currentTs) return false;
    const diffHours = Math.abs(currentTs - prevTs) / (1000 * 60 * 60);
    if (diffHours <= 24) return false;
  }
  return true;
}

function normalizeTitle(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/gi, ' ').trim();
}

function mapSeverityScore(score: number | null): string {
  if (score == null) return 'low';
  if (score >= 0.9) return 'critical';
  if (score >= 0.6) return 'high';
  if (score >= 0.3) return 'medium';
  return 'low';
}
