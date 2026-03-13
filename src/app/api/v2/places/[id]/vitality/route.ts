/**
 * Place-level vitality — territorial continuity scoped to a place.
 * Filters reconstruction by governorate, events by place_id.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withClient, isDbConfigured } from '@/db/client';
import { getPlaceById } from '@/db/repositories/place-repository';
import type { VitalityReadModel, MeasuredIndicator, ProxyIndicator, SupportingEvent, SupportingPlace } from '@/lib/read-models/vitality';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

const VITALITY_EVENT_TYPES = [
  'reconstruction', 'solidarity', 'cultural_event', 'cultural_resilience',
  'aid_delivery_verified', 'service_restoration', 'sports_cohesion', 'civil_society_mobilization',
];

async function fetchReconstruction(): Promise<{ projects: Array<{ governorate?: string }>; total: number }> {
  const res = await fetch(`${BASE}/api/v2/reconstruction`, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (!res.ok) return { projects: [], total: 0 };
  const data = (await res.json()) as { projects?: Array<{ governorate?: string }>; total?: number };
  return { projects: data.projects ?? [], total: data.total ?? 0 };
}

function matchesPlace(placeName: string, governorate?: string | null): boolean {
  const n = placeName.toLowerCase().trim();
  const g = (governorate ?? '').toLowerCase().trim();
  if (!g) return false;
  return n === g || n.includes(g) || g.includes(n);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured', code: 500 },
      { status: 500 }
    );
  }

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid place ID format' }, { status: 400 });
  }

  try {
    const place = await withClient((client) => getPlaceById(client, id));
    if (!place) {
      return NextResponse.json({ error: 'Place not found', code: 404 }, { status: 404 });
    }

    const placeName = place.name_primary;
    const [reconstruction, vitalityEvents] = await Promise.all([
      fetchReconstruction(),
      withClient(async (client) => {
        const { rows } = await client.query<{ id: string; canonical_title: string; event_type: string | null; occurred_at: Date }>(
          `SELECT id, canonical_title, event_type, occurred_at
           FROM event
           WHERE place_id = $1 AND is_active = true
             AND event_type = ANY($2::text[])
           ORDER BY occurred_at DESC
           LIMIT 20`,
          [id, VITALITY_EVENT_TYPES]
        );
        return rows.map((r) => ({
          id: r.id,
          title: r.canonical_title,
          category: r.event_type,
          occurredAt: r.occurred_at.toISOString(),
        }));
      }),
    ]);

    const projectsHere = reconstruction.projects.filter((p) => matchesPlace(placeName, p.governorate));
    const wbCount = projectsHere.length;

    const measured: MeasuredIndicator[] = [];
    const proxy: ProxyIndicator[] = [
      { key: 'wb_projects', label: 'Projets WB (territoire)', value: wbCount, unit: null, source: 'World Bank', updatedAt: new Date().toISOString() },
    ];

    const supportingEvents: SupportingEvent[] = vitalityEvents;
    const supportingPlaces: SupportingPlace[] = [
      { name: placeName, governorate: placeName, geoPrecision: 'governorate' },
    ];

    const coverage: string[] = [];
    if (wbCount > 0) coverage.push(`${wbCount} projet(s) WB sur ce territoire`);
    if (vitalityEvents.length > 0) coverage.push(`${vitalityEvents.length} événement(s) continuité/reprise`);
    if (coverage.length === 0) coverage.push('Données partielles pour ce lieu');

    const gaps: string[] = [];
    if (wbCount === 0 && reconstruction.total > 0) gaps.push('Aucun projet WB géolocalisé sur ce gouvernorat');
    if (vitalityEvents.length === 0) gaps.push('Aucun événement de continuité récent pour ce lieu');

    const caveats: string[] = [
      'Vitalité territoriale — pas déduite de la polarité lumiere/ombre.',
      'Reconstruction: filtrage par nom de gouvernorat.',
    ];

    const summary = [
      wbCount > 0 && `${wbCount} projet(s) WB`,
      vitalityEvents.length > 0 && `${vitalityEvents.length} événement(s) de continuité`,
    ]
      .filter(Boolean)
      .join('. ') || `Vitalité pour ${placeName}: données limitées.`;

    const payload: VitalityReadModel = {
      summary,
      measuredIndicators: measured,
      proxyIndicators: proxy,
      narrativeSignals: [],
      supportingEvents,
      supportingPlaces,
      coverage,
      gaps,
      caveats,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 's-maxage=120, stale-while-revalidate=300' },
    });
  } catch (err) {
    console.error('Place vitality API error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 500 },
      { status: 500 }
    );
  }
}
