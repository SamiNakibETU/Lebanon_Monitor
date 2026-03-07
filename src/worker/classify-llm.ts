/**
 * Claude Haiku batch classification for ambiguous titles.
 * Used when pre-classifier returns null.
 */

import { logger } from '@/lib/logger';
import type { LebanonEvent } from '@/types/events';
import type { Classification, EventCategory, Severity } from '@/types/events';

const BATCH_SIZE = 30;
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

export interface LLMClassificationItem {
  classification: Classification;
  confidence: number;
  category: string;
  severity: Severity;
  is_about_lebanon: boolean;
}

export async function classifyWithClaude(
  items: Array<{ event: LebanonEvent; index: number }>
): Promise<Map<number, LLMClassificationItem>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    logger.warn('ANTHROPIC_API_KEY not set, skipping LLM classification');
    return new Map();
  }

  const results = new Map<number, LLMClassificationItem>();

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const prompt = `You are a Lebanese news classifier for the "Lebanon Monitor" OSINT dashboard.

For each news item below, return a JSON array with one object per item, in the same order:
- classification: "ombre" (negative: violence, crisis, destruction, political failure, economic collapse) or "lumiere" (positive: peace, culture, reconstruction, diplomacy success, festivals) or "neutre" (factual, routine, weather)
- confidence: 0.0-1.0
- category: hierarchical code (e.g. "security.strike", "politics.government", "culture.festival", "economy.crisis")
- severity: "critical" | "high" | "medium" | "low"
- is_about_lebanon: boolean

CRITICAL: A ceasefire REJECTION, FAILURE, or REFUSAL is OMBRE, not lumiere. Military operations, airstrikes, casualties are ALWAYS ombre.

Return ONLY a JSON array, no markdown, no explanation.

Items (one per line, return same order):
${batch.map((b) => b.event.title).join('\n')}`;

    try {
      const res = await fetch(ANTHROPIC_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-latest',
          max_tokens: 2048,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!res.ok) {
        throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
      }

      const data = (await res.json()) as { content?: Array<{ text?: string }> };
      const text = data.content?.[0]?.text ?? '';
      const parsed = parseJsonArray(text);

      for (let j = 0; j < batch.length && j < parsed.length; j++) {
        const p = parsed[j] as Record<string, unknown>;
        const idx = batch[j]!.index; // index in toProcess array
        const classification = normalizeClassification(String(p?.classification ?? 'neutre'));
        const category = String(p?.category ?? 'neutral');
        const severity = normalizeSeverity(String(p?.severity ?? 'low'));

        results.set(idx, {
          classification,
          confidence: clamp(0, 1, Number(p?.confidence) || 0.7),
          category,
          severity,
          is_about_lebanon: Boolean(p?.is_about_lebanon !== false),
        });
      }
    } catch (err) {
      logger.warn('Claude classification failed', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return results;
}

function parseJsonArray(text: string): unknown[] {
  const trimmed = text.replace(/^```json?\s*|\s*```$/g, '').trim();
  try {
    const arr = JSON.parse(trimmed);
    return Array.isArray(arr) ? arr : [];
  } catch {
    const match = trimmed.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        //
      }
    }
    return [];
  }
}

function normalizeClassification(s: string): Classification {
  const l = s.toLowerCase();
  if (l === 'ombre') return 'ombre';
  if (l === 'lumiere' || l === 'lumière') return 'lumiere';
  return 'neutre';
}

function normalizeSeverity(s: string): Severity {
  const l = s.toLowerCase();
  if (l === 'critical') return 'critical';
  if (l === 'high') return 'high';
  if (l === 'medium') return 'medium';
  return 'low';
}

function clamp(min: number, max: number, v: number): number {
  return Math.max(min, Math.min(max, v));
}
