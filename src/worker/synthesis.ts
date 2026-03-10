/**
 * AI Synthesis — Groq generates daily Lumière/Ombre briefings.
 * Called 2x/day (8h and 20h Beirut) via cron or POST /api/admin/synthesis.
 * Uses Groq first, then Anthropic fallback.
 */

import { withClient } from '@/db/client';
import { listEvents } from '@/db/repositories/event-repository';
import { getTranslationsForEvents } from '@/db/repositories/event-translation-repository';
import { redisSet, redisGet, isRedisConfigured } from '@/lib/redis';
import { getSanitizedAnthropicKey } from '@/lib/anthropic';
import { callAnthropic } from '@/lib/anthropic-client';
import { callGroq, getSanitizedGroqKey } from '@/lib/groq-client';

const SYNTHESIS_REDIS_KEY = 'lebanon-monitor:synthesis';
const SYNTHESIS_TTL = 12 * 60 * 60; // 12 hours

const SYNTHESIS_SYSTEM = `Tu es un analyste OSINT spécialisé sur le Liban. Tu rédiges des briefings quotidiens pour le tableau de bord Lebanon Monitor.

Chaque briefing est affiché tel quel à l'utilisateur. Tu dois être factuel, dense, sans formules creuses. Style câble diplomatique : chiffres et noms de lieux quand disponibles.

Le dashboard affiche deux colonnes : Lumière (positif) et Ombre (négatif). Tu produis exactement deux résumés de 3 à 4 phrases chacun.

En plus, tu fournis un rapport situationnel structuré en 5 sections avec 2 phrases chacune : security, economy, humanitarian, politics, regional.`;

const SYNTHESIS_USER_TEMPLATE = `À partir des événements des dernières 24h ci-dessous, rédige deux résumés :

1. lumiere : développements positifs (reconstruction, culture, diplomatie réussie, aide humanitaire arrivée, progrès économiques, solidarité, reconnaissance internationale).

2. ombre : développements négatifs (sécurité, crises, tensions, infrastructure défaillante, violences, déplacements, échecs diplomatiques).

Événements :
{EVENTS_JSON}

Tu DOIS répondre par un seul objet JSON valide. Aucun texte avant ou après. Aucun markdown. Format exact :
{"lumiere":"phrase1. phrase2. phrase3.","ombre":"phrase1. phrase2. phrase3.","sections":{"security":"...","economy":"...","humanitarian":"...","politics":"...","regional":"..."},"generated_at":"2025-03-08T12:00:00.000Z"}`;

export interface SynthesisResult {
  lumiere: string;
  ombre: string;
  generated_at: string;
  sections?: {
    security: string;
    economy: string;
    humanitarian: string;
    politics: string;
    regional: string;
  };
}

export type SynthesisDiagnostics =
  | { ok: true; result: SynthesisResult }
  | { ok: false; step: string; error: string };

/** Run synthesis with step-by-step diagnostics for admin/debug. */
export async function generateSynthesisWithDiagnostics(): Promise<SynthesisDiagnostics> {
  const hasGroq = Boolean(getSanitizedGroqKey());
  const hasAnthropic = Boolean(getSanitizedAnthropicKey());
  if (!hasGroq && !hasAnthropic) {
    return {
      ok: false,
      step: 'llm_key',
      error: 'No LLM key configured. Set GROQ_API_KEY (preferred) or ANTHROPIC_API_KEY.',
    };
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  let events: { title: string; classification: string | null; category: string | null }[];
  try {
    const out = await withClient(async (client) => {
      const list = await listEvents(client, { from_date: since, limit: 80 });
      const trans = await getTranslationsForEvents(client, list.events.map((e) => e.id), 'fr');
      return {
        events: list.events.map((e) => ({
          title: (trans.get(e.id) ?? e.canonical_title).slice(0, 120),
          classification: e.polarity_ui ?? null,
          category: e.event_type ?? null,
        })),
      };
    });
    events = out.events;
  } catch (e) {
    return { ok: false, step: 'database', error: e instanceof Error ? e.message : String(e) };
  }

  if (events.length === 0) {
    const fallback: SynthesisResult = {
      lumiere: 'Aucun événement Lumière majeur ces dernières 24 heures.',
      ombre: 'Aucun événement Ombre majeur ces dernières 24 heures.',
      sections: {
        security: 'Aucun signal sécurité majeur sur les dernières 24h.',
        economy: 'Pas de variation économique majeure observée.',
        humanitarian: 'Pas de changement humanitaire majeur observé.',
        politics: 'Pas d’évolution politique majeure observée.',
        regional: 'Pas de bascule régionale notable observée.',
      },
      generated_at: new Date().toISOString(),
    };
    if (isRedisConfigured()) {
      await redisSet(SYNTHESIS_REDIS_KEY, fallback, { ex: SYNTHESIS_TTL });
    }
    return { ok: true, result: fallback };
  }

  const eventsJson = JSON.stringify(events, null, 0);
  const userContent = SYNTHESIS_USER_TEMPLATE.replace('{EVENTS_JSON}', eventsJson);

  let text: string | null;
  try {
    if (hasGroq) {
      text = await callGroq({
        messages: [
          { role: 'system', content: SYNTHESIS_SYSTEM },
          { role: 'user', content: userContent },
        ],
        max_tokens: 1024,
        temperature: 0.3,
        timeoutMs: 30_000,
      });
    } else {
      text = await callAnthropic({
        system: SYNTHESIS_SYSTEM,
        messages: [{ role: 'user', content: userContent }],
        max_tokens: 1024,
        temperature: 0.3,
      });
    }
  } catch (e) {
    return {
      ok: false,
      step: hasGroq ? 'groq_api' : 'anthropic_api',
      error: e instanceof Error ? e.message : String(e),
    };
  }

  if (!text) {
    return {
      ok: false,
      step: hasGroq ? 'groq_api' : 'anthropic_api',
      error: hasGroq ? 'Groq returned empty response' : 'Claude returned empty response',
    };
  }

  const parsed = parseSynthesisJson(text);
  if (!parsed) {
    return { ok: false, step: 'parse_json', error: `Claude response could not be parsed. First 200 chars: ${text.slice(0, 200)}` };
  }

  const result: SynthesisResult = {
    lumiere: parsed.lumiere ?? 'Synthèse non disponible.',
    ombre: parsed.ombre ?? 'Synthèse non disponible.',
    sections: parsed.sections,
    generated_at: parsed.generated_at ?? new Date().toISOString(),
  };

  if (isRedisConfigured()) {
    await redisSet(SYNTHESIS_REDIS_KEY, result, { ex: SYNTHESIS_TTL });
  }

  return { ok: true, result };
}

export async function generateSynthesis(): Promise<SynthesisResult | null> {
  const diag = await generateSynthesisWithDiagnostics();
  return diag.ok ? diag.result : null;
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
