/**
 * AI Synthesis — Claude Haiku generates daily Lumière/Ombre briefings.
 * Called 2x/day (8h and 20h Beirut) via cron or POST /api/admin/synthesis.
 * Uses centralized Anthropic client and best-practice prompts.
 */

import { withClient } from '@/db/client';
import { listEvents } from '@/db/repositories/event-repository';
import { getTranslationsForEvents } from '@/db/repositories/event-translation-repository';
import { redisSet, redisGet, isRedisConfigured } from '@/lib/redis';
import { getSanitizedAnthropicKey } from '@/lib/anthropic';
import { callAnthropic } from '@/lib/anthropic-client';

const SYNTHESIS_REDIS_KEY = 'lebanon-monitor:synthesis';
const SYNTHESIS_TTL = 12 * 60 * 60; // 12 hours

const SYNTHESIS_SYSTEM = `Tu es un analyste OSINT spécialisé sur le Liban. Tu rédiges des briefings quotidiens pour le tableau de bord Lebanon Monitor.

Chaque briefing est affiché tel quel à l'utilisateur. Tu dois être factuel, dense, sans formules creuses. Style câble diplomatique : chiffres et noms de lieux quand disponibles.

Le dashboard affiche deux colonnes : Lumière (positif) et Ombre (négatif). Tu produis exactement deux résumés de 3 à 4 phrases chacun.`;

const SYNTHESIS_USER_TEMPLATE = `À partir des événements des dernières 24h ci-dessous, rédige deux résumés :

1. lumiere : développements positifs (reconstruction, culture, diplomatie réussie, aide humanitaire arrivée, progrès économiques, solidarité, reconnaissance internationale).

2. ombre : développements négatifs (sécurité, crises, tensions, infrastructure défaillante, violences, déplacements, échecs diplomatiques).

Événements :
{EVENTS_JSON}

Tu DOIS répondre par un seul objet JSON valide. Aucun texte avant ou après. Aucun markdown. Format exact :
{"lumiere":"phrase1. phrase2. phrase3.","ombre":"phrase1. phrase2. phrase3.","generated_at":"2025-03-08T12:00:00.000Z"}`;

export interface SynthesisResult {
  lumiere: string;
  ombre: string;
  generated_at: string;
}

export async function generateSynthesis(): Promise<SynthesisResult | null> {
  if (!getSanitizedAnthropicKey()) return null;

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
  const userContent = SYNTHESIS_USER_TEMPLATE.replace('{EVENTS_JSON}', eventsJson);

  const text = await callAnthropic({
    system: SYNTHESIS_SYSTEM,
    messages: [{ role: 'user', content: userContent }],
    max_tokens: 1024,
    temperature: 0.3,
  });

  if (!text) return null;

  const parsed = parseSynthesisJson(text);
  if (!parsed) return null;

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

function parseSynthesisJson(text: string): Partial<SynthesisResult> | null {
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/g, '')
    .replace(/\s*```$/g, '')
    .replace(/^Here's? the (JSON|response):\s*/i, '')
    .trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as Partial<SynthesisResult>;
    if (parsed && (typeof parsed.lumiere === 'string' || typeof parsed.ombre === 'string')) return parsed;
    return null;
  } catch {
    return null;
  }
}

export async function getCachedSynthesis(): Promise<SynthesisResult | null> {
  if (!isRedisConfigured()) return null;
  return redisGet<SynthesisResult>(SYNTHESIS_REDIS_KEY);
}
