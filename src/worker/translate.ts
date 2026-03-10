/**
 * Groq translation — AR/FR/EN.
 */

import { withClient } from '@/db/client';
import { getEventTranslation, upsertEventTranslation } from '@/db/repositories/event-translation-repository';
import { detectLanguage } from '@/core/language/detect';
import { logger } from '@/lib/logger';
import { callGroq, getSanitizedGroqKey } from '@/lib/groq-client';
import type { PoolClient } from 'pg';
import type { Lang } from '@/db/repositories/event-translation-repository';

const LANGS: Lang[] = ['ar', 'fr', 'en'];
const MAX_RETRIES = 2;

export async function translateAndStore(
  eventId: string,
  title: string,
  summary?: string | null
): Promise<void> {
  const apiKey = getSanitizedGroqKey();
  const from = detectLanguage(title);
  let successCount = 0;
  let attemptedCount = 0;

  await withClient(async (client) => {
    await updateTranslationStatus(client, eventId, 'in_progress', {
      provider: apiKey ? 'groq-llama-3.1-8b-instant' : 'fallback-copy',
    });

    for (const to of LANGS) {
      attemptedCount++;
      if (to === from) {
        await upsertEventTranslation(client, {
          event_id: eventId,
          language: to,
          title,
          summary: summary ?? null,
          provider: 'original',
        });
        successCount++;
        continue;
      }

      const existing = await getEventTranslation(client, eventId, to);
      if (existing?.title) continue;

      if (!apiKey) {
        // Fallback strategy: keep source text so UI is never empty.
        await upsertEventTranslation(client, {
          event_id: eventId,
          language: to,
          title,
          summary: summary ?? null,
          provider: 'fallback-copy',
        });
        successCount++;
        continue;
      }

      const translated = await translatePayloadWithRetry(
        { title, summary: summary ?? null },
        from,
        to
      );
      if (translated) {
        await upsertEventTranslation(client, {
          event_id: eventId,
          language: to,
          title: translated.title,
          summary: translated.summary ?? null,
          provider: 'groq-llama-3.1-8b-instant',
        });
        successCount++;
      }
    }

    const status =
      successCount >= LANGS.length
        ? 'completed'
        : successCount > 0
          ? 'partial'
          : 'failed';
    await updateTranslationStatus(client, eventId, status, {
      provider: apiKey ? 'groq-llama-3.1-8b-instant' : 'fallback-copy',
      attemptedCount,
      successCount,
      sourceLanguage: from,
      updatedAt: new Date().toISOString(),
    });
  });
}

async function translatePayloadWithRetry(
  payload: { title: string; summary: string | null },
  from: Lang,
  to: Lang
): Promise<{ title: string; summary: string | null } | null> {
  let last: { title: string; summary: string | null } | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const out = await translatePayload(payload, from, to);
    if (out) return out;
    last = out;
    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
  }
  return last;
}

async function translatePayload(
  payload: { title: string; summary: string | null },
  from: Lang,
  to: Lang
): Promise<{ title: string; summary: string | null } | null> {
  const fromLabel = from.toUpperCase();
  const toLabel = to.toUpperCase();

  try {
    const prompt = [
      `Translate from ${fromLabel} to ${toLabel}.`,
      'Return ONLY a valid JSON object with keys "title" and "summary".',
      'Do not add commentary. Keep names and numbers unchanged when possible.',
      `Input JSON: ${JSON.stringify(payload)}`,
    ].join('\n');

    const text = await callGroq({
      messages: [
        { role: 'system', content: 'You are a precise multilingual translator.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0,
      max_tokens: 900,
      timeoutMs: 12_000,
    });
    if (!text) return null;
    return parseTranslatedJson(text, payload);
  } catch (err) {
    logger.warn('Groq translation failed', {
      from,
      to,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

function parseTranslatedJson(
  text: string,
  fallback: { title: string; summary: string | null }
): { title: string; summary: string | null } | null {
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/g, '')
    .replace(/\s*```$/g, '')
    .trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as { title?: unknown; summary?: unknown };
    const translatedTitle = typeof parsed.title === 'string' ? parsed.title.trim() : '';
    const translatedSummary =
      typeof parsed.summary === 'string'
        ? parsed.summary.trim()
        : parsed.summary == null
          ? null
          : '';

    if (!translatedTitle) return null;
    return {
      title: translatedTitle,
      summary: translatedSummary === '' ? fallback.summary : translatedSummary,
    };
  } catch {
    return null;
  }
}

async function updateTranslationStatus(
  client: PoolClient,
  eventId: string,
  status: 'in_progress' | 'completed' | 'partial' | 'failed',
  extra: Record<string, unknown>
): Promise<void> {
  await client.query(
    `UPDATE event
     SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
       'translationStatus', $2::text,
       'translationMeta', COALESCE(metadata->'translationMeta', '{}'::jsonb) || $3::jsonb
     ),
     updated_at = now()
     WHERE id = $1`,
    [eventId, status, JSON.stringify(extra)]
  );
}
