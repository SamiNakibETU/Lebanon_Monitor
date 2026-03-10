/**
 * API v2 synthesis — AI briefing Lumière/Ombre.
 * Returns cached synthesis from Redis. If cache miss, attempts generation,
 * then falls back to a rule-based synthesis from event counts.
 */
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { getSanitizedGroqKey } from '@/lib/groq-client';
import { getCachedSynthesis, generateSynthesis } from '@/worker/synthesis';
import { withClient, isDbConfigured } from '@/db/client';

async function buildFallbackSynthesis() {
  if (!isDbConfigured()) {
    return {
      lumiere: 'Données en attente de traitement.',
      ombre: 'Données en attente de traitement.',
      generated_at: new Date().toISOString(),
    };
  }
  try {
    const stats = await withClient(async (client) => {
      const r = await client.query<{
        total: string; armed: string; political: string;
        humanitarian: string; lumiere: string; ombre: string;
        displacement: string; solidarity: string;
      }>(
        `SELECT
          COUNT(*) FILTER (WHERE occurred_at >= NOW() - INTERVAL '24 hours')::int AS total,
          COUNT(*) FILTER (WHERE occurred_at >= NOW() - INTERVAL '24 hours' AND event_type IN ('armed_conflict','violence'))::int AS armed,
          COUNT(*) FILTER (WHERE occurred_at >= NOW() - INTERVAL '24 hours' AND event_type = 'political_tension')::int AS political,
          COUNT(*) FILTER (WHERE occurred_at >= NOW() - INTERVAL '24 hours' AND event_type = 'humanitarian')::int AS humanitarian,
          COUNT(*) FILTER (WHERE occurred_at >= NOW() - INTERVAL '24 hours' AND polarity_ui = 'lumiere')::int AS lumiere,
          COUNT(*) FILTER (WHERE occurred_at >= NOW() - INTERVAL '24 hours' AND polarity_ui = 'ombre')::int AS ombre,
          COUNT(*) FILTER (WHERE occurred_at >= NOW() - INTERVAL '24 hours' AND event_type = 'displacement')::int AS displacement,
          COUNT(*) FILTER (WHERE occurred_at >= NOW() - INTERVAL '24 hours' AND event_type IN ('solidarity','cultural_event','reconstruction'))::int AS solidarity
        FROM event WHERE is_active = true`
      );
      return r.rows[0];
    });
    const armed = Number(stats?.armed ?? 0);
    const political = Number(stats?.political ?? 0);
    const total = Number(stats?.total ?? 0);
    const displacement = Number(stats?.displacement ?? 0);
    const solidarity = Number(stats?.solidarity ?? 0);
    const lumiereN = Number(stats?.lumiere ?? 0);
    const ombreN = Number(stats?.ombre ?? 0);

    const ombreText = total > 0
      ? `${total} événements recensés en 24h. ${armed} incidents armés, ${political} tensions politiques${displacement > 0 ? `, ${displacement} déplacements de population` : ''}. Situation: ${ombreN > armed ? 'dégradée' : 'sous haute tension'}.`
      : 'Aucun événement significatif dans les dernières 24 heures.';

    const lumiereText = lumiereN > 0 || solidarity > 0
      ? `${lumiereN} signaux positifs détectés${solidarity > 0 ? `, dont ${solidarity} actions de solidarité ou reconstruction` : ''}. La société civile et les organisations internationales maintiennent leurs efforts.`
      : 'Aucun signal positif majeur détecté dans les dernières 24 heures. Les activités humanitaires et culturelles restent limitées.';

    return { lumiere: lumiereText, ombre: ombreText, generated_at: new Date().toISOString() };
  } catch {
    return {
      lumiere: 'Analyse en cours de chargement.',
      ombre: 'Analyse en cours de chargement.',
      generated_at: new Date().toISOString(),
    };
  }
}

export async function GET() {
  try {
    const result = await getCachedSynthesis();
    if (result) {
      return NextResponse.json(result, {
        headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=3600' },
      });
    }

    if (getSanitizedGroqKey()) {
      const generated = await generateSynthesis();
      if (generated) {
        return NextResponse.json(generated, {
          headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=3600' },
        });
      }
    }

    const fallback = await buildFallbackSynthesis();
    return NextResponse.json(fallback, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    });
  } catch (err) {
    console.error('API v2 synthesis error', err);
    const fallback = await buildFallbackSynthesis();
    return NextResponse.json(fallback);
  }
}
