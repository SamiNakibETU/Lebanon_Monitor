/**
 * HF Opus-MT translation — AR/FR/EN.
 */

import { withClient } from '@/db/client';
import { getEventTranslation, upsertEventTranslation } from '@/db/repositories/event-translation-repository';
import { detectLanguage } from '@/core/language/detect';
import { logger } from '@/lib/logger';
import type { PoolClient } from 'pg';
import type { Lang } from '@/db/repositories/event-translation-repository';

const HF_API = 'https://api-inference.huggingface.co/models';

const MODELS: Record<string, string> = {
  'ar-en': 'Helsinki-NLP/opus-mt-tc-big-ar-en',
  'ar-fr': 'Helsinki-NLP/opus-mt-ar-fr',
  'fr-en': 'Helsinki-NLP/opus-mt-fr-en',
  'fr-ar': 'Helsinki-NLP/opus-mt-fr-ar',
  'en-fr': 'Helsinki-NLP/opus-mt-en-fr',
  'en-ar': 'Helsinki-NLP/opus-mt-tc-big-en-ar',
};

const LANGS: Lang[] = ['ar', 'fr', 'en'];
const MAX_RETRIES = 2;

export async function translateAndStore(
  eventId: string,
  title: string,
  summary?: string | null
): Promise<void> {
  const token = process.env.HF_API_TOKEN;
  const from = detectLanguage(title);
  let successCount = 0;
  let attemptedCount = 0;

  await withClient(async (client) => {
    await updateTranslationStatus(client, eventId, 'in_progress', {
      provider: token ? 'opus-mt' : 'fallback-copy',
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

      if (!token) {
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

      const translated = await translateTextWithRetry(title, from, to, token);
      const translatedSummary = summary
        ? await translateTextWithRetry(summary, from, to, token)
        : null;
      if (translated) {
        await upsertEventTranslation(client, {
          event_id: eventId,
          language: to,
          title: translated,
          summary: translatedSummary ?? null,
          provider: 'opus-mt',
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
      provider: token ? 'opus-mt' : 'fallback-copy',
      attemptedCount,
      successCount,
      sourceLanguage: from,
      updatedAt: new Date().toISOString(),
    });
  });
}

async function translateTextWithRetry(
  text: string,
  from: Lang,
  to: Lang,
  token: string
): Promise<string | null> {
  let last: string | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const out = await translateText(text, from, to, token);
    if (out) return out;
    last = out;
    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
  }
  return last;
}

async function translateText(
  text: string,
  from: Lang,
  to: Lang,
  token: string
): Promise<string | null> {
  const key = `${from}-${to}`;
  const model = MODELS[key];
  if (!model) return null;

  try {
    const res = await fetch(`${HF_API}/${model}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: text }),
    });

    if (!res.ok) {
      if (res.status === 503) {
        const body = (await res.json()) as { estimated_time?: number };
        const waitMs = Math.min((body.estimated_time ?? 20) * 1000, 30000);
        logger.info('HF model loading, retrying after wait', { model, waitMs });
        await new Promise((r) => setTimeout(r, waitMs));

        const retry = await fetch(`${HF_API}/${model}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: text }),
        });
        if (retry.ok) {
          const retryData = (await retry.json()) as Array<{ translation_text?: string }>;
          return retryData[0]?.translation_text ?? null;
        }
        logger.warn('HF model retry failed', { model, status: retry.status });
      }
      return null;
    }

    const data = (await res.json()) as Array<{ translation_text?: string }>;
    return data[0]?.translation_text ?? null;
  } catch (err) {
    logger.warn('Translation failed', {
      from,
      to,
      error: err instanceof Error ? err.message : String(err),
    });
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
       'translationStatus', $2,
       'translationMeta', COALESCE(metadata->'translationMeta', '{}'::jsonb) || $3::jsonb
     ),
     updated_at = now()
     WHERE id = $1`,
    [eventId, status, JSON.stringify(extra)]
  );
}
