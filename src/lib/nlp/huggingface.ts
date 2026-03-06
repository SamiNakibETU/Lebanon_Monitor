/**
 * Hugging Face Inference API client for sentiment analysis.
 * Uses cardiffnlp/twitter-xlm-roberta-base-sentiment (multilingual) to avoid 410 on deprecated models.
 */

import { createLruCache } from './cache';
import { logger } from '@/lib/logger';

const HF_BASE = 'https://api-inference.huggingface.co/models';
const TIMEOUT_MS = 5000;

// Multilingual model — works for ar, fr, en. Returns positive/negative/neutral.
const SENTIMENT_MODEL = 'cardiffnlp/twitter-xlm-roberta-base-sentiment';

export interface HFSentimentResult {
  label: 'lumiere' | 'ombre' | 'neutre';
  score: number;
}

const cache = createLruCache<HFSentimentResult>(1000, 60 * 60 * 1000);

function hashKey(text: string): string {
  return text.slice(0, 200);
}

/** Global: skip HF after 410/429 to avoid log flood. */
let hfDisabledUntil = 0;

/**
 * Map HF API response to Lumière/Ombre/Neutre.
 * XLM-Roberta returns positive, negative, neutral.
 */
function mapToClassification(raw: unknown): HFSentimentResult | null {
  const arr = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? [raw] : null;
  if (!arr || arr.length === 0) return null;

  const item = arr[0];
  if (!item || typeof item !== 'object') return null;

  const obj = item as Record<string, unknown>;
  const label = String(obj.label ?? '').toLowerCase();
  const score = typeof obj.score === 'number' ? obj.score : 0.5;

  if (label.includes('positive') || label.includes('positif')) return { label: 'lumiere', score };
  if (label.includes('negative') || label.includes('négatif')) return { label: 'ombre', score };
  return { label: 'neutre', score };
}

async function fetchWithTimeout(
  url: string,
  body: string,
  token: string
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res;
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

/**
 * Classify a single text with HF Inference API.
 */
export async function classifyWithHF(text: string): Promise<HFSentimentResult | null> {
  const token = process.env.HF_API_TOKEN;
  if (!token) return null;
  if (Date.now() < hfDisabledUntil) return null;

  const trimmed = text.trim().slice(0, 500);
  if (!trimmed) return null;

  const key = hashKey(trimmed);
  const cached = cache.get(key);
  if (cached) return cached;

  const url = `${HF_BASE}/${SENTIMENT_MODEL}`;

  try {
    const res = await fetchWithTimeout(url, JSON.stringify({ inputs: trimmed }), token);
    if (!res.ok) {
      if (res.status === 410 || res.status === 429) {
        hfDisabledUntil = Date.now() + 60_000; // Disable 1 min on 410/429
        if (res.status === 410) logger.warn('HF model unavailable (410), using keywords only for 1min');
        else logger.warn('HF rate limited (429), using keywords only for 1min');
      } else if (res.status === 503) {
        logger.warn('HF model loading', { model: SENTIMENT_MODEL });
      } else {
        logger.warn('HF API error', { status: res.status, model: SENTIMENT_MODEL });
      }
      return null;
    }
    const data = (await res.json()) as unknown;
    const result = mapToClassification(data);
    if (result) cache.set(key, result);
    return result;
  } catch (e) {
    logger.warn('HF fetch failed', {
      message: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}

const BATCH_SIZE = 5;

/**
 * Batch classify texts (max 5 concurrent to respect rate limits).
 */
export async function classifyBatch(texts: string[]): Promise<(HFSentimentResult | null)[]> {
  if (texts.length === 0) return [];

  const results: (HFSentimentResult | null)[] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map((t) => classifyWithHF(t)));
    results.push(...batchResults);
    if (hfDisabledUntil > Date.now()) break;
  }

  return results;
}
