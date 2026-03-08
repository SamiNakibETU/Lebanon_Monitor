/**
 * AI Synthesis — Claude Haiku generates daily Lumière/Ombre briefings.
 * Called 2x/day (8h and 20h Beirut) via cron or POST /api/admin/synthesis.
 */

import { withClient } from '@/db/client';
import { listEvents } from '@/db/repositories/event-repository';
import { getTranslationsForEvents } from '@/db/repositories/event-translation-repository';
import { redisSet, redisGet, isRedisConfigured } from '@/lib/redis';

const SYNTHESIS_REDIS_KEY = 'lebanon-monitor:synthesis';
const SYNTHESIS_TTL = 12 * 60 * 60; // 12 hours

const SYNTHESIS_PROMPT = `Tu es un analyste OSINT qui rédige un briefing quotidien sur le Liban.
À partir des événements ci-dessous, rédige DEUX résumés de 3-4 phrases chacun :

1. LUMIÈRE : les développements positifs (reconstruction, culture, diplomatie réussie, aide arrivée)
2. OMBRE : les développements négatifs (sécurité, crises, tensions, infrastructure défaillante)

Style : factuel, dense, comme un câble diplomatique. Pas de formules creuses.
Inclure des chiffres et noms de lieux quand disponibles.
Langue : français.

Événements des dernières 24h :
{EVENTS_JSON}

Réponds en JSON uniquement, pas de markdown :
{ "lumiere": "...", "ombre": "...", "generated_at": "ISO8601" }`;

export interface SynthesisResult {
  lumiere: string;
  ombre: string;
  generated_at: string;
}

export async function generateSynthesis(): Promise<SynthesisResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const { events } = await withClient(async (client) => {
    const out = await listEvents(client, {
      from_date: since,
      limit: 150,
    });
    const trans = await getTranslationsForEvents(client, out.events.map((e) => e.id), 'fr');
    return {
      events: out.events.map((e) => ({
        title: trans.get(e.id) ?? e.canonical_title,
        classification: e.polarity_ui,
        category: e.event_type,
        occurredAt: e.occurred_at,
        source: (e.metadata as Record<string, unknown>)?.source ?? null,
      })),
    };
  });

  if (events.length === 0) {
    const fallback: SynthesisResult = {
      lumiere: 'Aucun événement Lumière majeur ces dernières 24 heures.',
      ombre: 'Aucun événement Ombre majeur ces dernières 24 heures.',
      generated_at: new Date().toISOString(),
    };
    if (isRedisConfigured()) {
      await redisSet(SYNTHESIS_REDIS_KEY, fallback, { ex: SYNTHESIS_TTL });
    }
    return fallback;
  }

  const eventsJson = JSON.stringify(events, null, 0);
  const prompt = SYNTHESIS_PROMPT.replace('{EVENTS_JSON}', eventsJson);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as { content?: Array<{ text?: string }> };
    const text = data.content?.[0]?.text ?? '';
    const parsed = parseSynthesisJson(text);

    if (parsed) {
      const result: SynthesisResult = {
        lumiere: parsed.lumiere ?? 'Synthèse non disponible.',
        ombre: parsed.ombre ?? 'Synthèse non disponible.',
        generated_at: parsed.generated_at ?? new Date().toISOString(),
      };
      if (isRedisConfigured()) {
        await redisSet(SYNTHESIS_REDIS_KEY, result, { ex: SYNTHESIS_TTL });
      }
      return result;
    }
  } catch (err) {
    console.error('Synthesis Claude error:', err);
  }

  return null;
}

function parseSynthesisJson(text: string): Partial<SynthesisResult> | null {
  const cleaned = text.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as Partial<SynthesisResult>;
  } catch {
    return null;
  }
}

export async function getCachedSynthesis(): Promise<SynthesisResult | null> {
  if (!isRedisConfigured()) return null;
  return redisGet<SynthesisResult>(SYNTHESIS_REDIS_KEY);
}
