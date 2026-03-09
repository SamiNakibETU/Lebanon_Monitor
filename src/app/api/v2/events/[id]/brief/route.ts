import { NextResponse } from 'next/server';
import { withClient, isDbConfigured } from '@/db/client';
import { getEventById } from '@/db/repositories/event-repository';
import { redisGet, redisSet, isRedisConfigured } from '@/lib/redis';
import { callGroq, getSanitizedGroqKey } from '@/lib/groq-client';

const BRIEF_TTL = 60 * 60;

interface BriefPayload {
  brief: string;
  generatedAt: string;
  model: string;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  if (!getSanitizedGroqKey()) {
    return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 503 });
  }

  const { id } = await params;
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid event ID format' }, { status: 400 });
  }

  const cacheKey = `v2:event:brief:${id}`;
  if (isRedisConfigured()) {
    const cached = await redisGet<BriefPayload>(cacheKey);
    if (cached) return NextResponse.json(cached);
  }

  const row = await withClient(async (client) => {
    const event = await getEventById(client, id);
    if (!event) return null;
    const obs = await client.query<{ source_name: string }>(
      `SELECT si.source_name
       FROM event_observation eo
       JOIN source_item si ON si.id = eo.source_item_id
       WHERE eo.event_id = $1
       ORDER BY eo.observed_at DESC NULLS LAST
       LIMIT 5`,
      [id]
    );
    return { event, sources: obs.rows.map((r) => r.source_name) };
  });

  if (!row) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const meta = (row.event.metadata ?? {}) as Record<string, unknown>;
  const prompt = [
    'Tu es analyste OSINT.',
    "En 2 phrases maximum, explique pourquoi cet événement est significatif pour la situation au Liban.",
    'Style: factuel, compact, sans spéculation.',
    `Titre: ${row.event.canonical_title}`,
    `Catégorie: ${row.event.event_type ?? 'unknown'}`,
    `Classification: ${row.event.polarity_ui ?? 'unknown'}`,
    `Lieu: ${(meta.resolvedPlaceName as string | undefined) ?? 'unknown'}`,
    `Sources: ${row.sources.join(', ') || 'unknown'}`,
    `Niveau vérification: ${row.event.verification_status ?? 'unknown'}`,
    'Retourne uniquement le texte final.',
  ].join('\n');

  const brief =
    (await callGroq({
      messages: [
        { role: 'system', content: 'You write concise OSINT analyst briefs in French.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 220,
      timeoutMs: 10_000,
    })) ?? 'Brief indisponible.';

  const payload: BriefPayload = {
    brief,
    generatedAt: new Date().toISOString(),
    model: 'groq:llama-3.1-8b-instant',
  };

  if (isRedisConfigured()) {
    await redisSet(cacheKey, payload, { ex: BRIEF_TTL });
  }

  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 's-maxage=600, stale-while-revalidate=3600' },
  });
}
