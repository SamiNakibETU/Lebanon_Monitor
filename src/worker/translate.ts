/**
 * HF Opus-MT translation — AR/FR/EN.
 */

import { withClient } from '@/db/client';
import { getEventTranslation, upsertEventTranslation } from '@/db/repositories/event-translation-repository';
import { detectLanguage } from '@/core/language/detect';
import { logger } from '@/lib/logger';
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

export async function translateAndStore(
  eventId: string,
  title: string,
  summary?: string | null
): Promise<void> {
  const token = process.env.HF_API_TOKEN;
  if (!token) {
    logger.warn('HF_API_TOKEN not set — translations disabled');
    return;
  }

  const from = detectLanguage(title);

  await withClient(async (client) => {
    for (const to of LANGS) {
      if (to === from) {
        await upsertEventTranslation(client, {
          event_id: eventId,
          language: to,
          title,
          summary: summary ?? null,
          provider: 'original',
        });
        continue;
      }

      const existing = await getEventTranslation(client, eventId, to);
      if (existing?.title) continue;

      const translated = await translateText(title, from, to, token);
      if (translated) {
        await upsertEventTranslation(client, {
          event_id: eventId,
          language: to,
          title: translated,
          summary: null,
          provider: 'opus-mt',
        });
      }
    }
  });
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
