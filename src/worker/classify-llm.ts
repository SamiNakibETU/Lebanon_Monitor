/**
 * Claude Haiku batch classification for ambiguous titles.
 * Used when pre-classifier returns null.
 * Uses centralized client, system message, and explicit EventCategory mapping.
 */

import { logger } from '@/lib/logger';
import { getSanitizedAnthropicKey } from '@/lib/anthropic';
import { callAnthropic } from '@/lib/anthropic-client';
import type { LebanonEvent } from '@/types/events';
import type { Classification, EventCategory, Severity } from '@/types/events';

const BATCH_SIZE = 30;

const EVENT_CATEGORIES: EventCategory[] = [
  'armed_conflict',
  'cultural_event',
  'displacement',
  'disinformation',
  'economic_crisis',
  'economic_positive',
  'environmental_negative',
  'environmental_positive',
  'infrastructure_failure',
  'institutional_progress',
  'international_recognition',
  'neutral',
  'political_tension',
  'reconstruction',
  'solidarity',
  'violence',
];

export interface LLMClassificationItem {
  classification: Classification;
  confidence: number;
  category: EventCategory;
  severity: Severity;
  is_about_lebanon: boolean;
}

const CLASSIFY_SYSTEM = `You classify Lebanese news headlines for the Lebanon Monitor OSINT dashboard.

The dashboard has two panels: LUMIÈRE (left, positive) and OMBRE (right, negative). Your classification determines which panel displays each event.

RULES:
- ombre: violence, airstrikes, casualties, ceasefire rejection/failure, military operations, economic collapse, political failure, displacement, infrastructure failure
- lumiere: reconstruction, cultural events, aid delivery, diplomacy success, festivals, institutional progress, solidarity
- neutre: factual routine news, weather, neutral announcements

Military operations and casualties are ALWAYS ombre. Ceasefire rejections and failures are ombre, not lumiere.

Return a JSON array. One object per headline, in the SAME ORDER. Each object: classification, confidence (0.0-1.0), category (from the list), severity (critical|high|medium|low), is_about_lebanon (boolean).

Category must be EXACTLY one of: ${EVENT_CATEGORIES.join(', ')}`;

const CLASSIFY_USER_TEMPLATE = `Classify each headline below. Return ONLY a valid JSON array — one object per headline, in the SAME order. No markdown, no explanation.

Headlines:
{ITEMS}`;

export async function classifyWithClaude(
  items: Array<{ event: LebanonEvent; index: number }>
): Promise<Map<number, LLMClassificationItem>> {
  const apiKey = getSanitizedAnthropicKey();
  if (!apiKey) {
    logger.warn('ANTHROPIC_API_KEY not set, skipping LLM classification');
    return new Map();
  }

  const results = new Map<number, LLMClassificationItem>();

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const headlines = batch.map((b) => b.event.title);
    const userContent = CLASSIFY_USER_TEMPLATE.replace(
      '{ITEMS}',
      headlines.map((h, j) => `${j + 1}. ${h}`).join('\n')
    );

    const text = await callAnthropic({
      system: CLASSIFY_SYSTEM,
      messages: [{ role: 'user', content: userContent }],
      max_tokens: 2048,
      temperature: 0,
    });

    if (!text) {
      logger.warn('Claude classification returned empty');
      continue;
    }

    const parsed = parseJsonArray(text);

    for (let j = 0; j < batch.length && j < parsed.length; j++) {
      const p = parsed[j] as Record<string, unknown>;
      const idx = batch[j]!.index;
      const classification = normalizeClassification(String(p?.classification ?? 'neutre'));
      const category = mapToEventCategory(String(p?.category ?? 'neutral'));
      const severity = normalizeSeverity(String(p?.severity ?? 'low'));

      results.set(idx, {
        classification,
        confidence: clamp(0, 1, Number(p?.confidence) || 0.7),
        category,
        severity,
        is_about_lebanon: Boolean(p?.is_about_lebanon !== false),
      });
    }
  }

  return results;
}

function parseJsonArray(text: string): unknown[] {
  const trimmed = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/g, '')
    .replace(/\s*```$/g, '')
    .trim();
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
  const l = s.toLowerCase().trim();
  if (l === 'ombre') return 'ombre';
  if (l === 'lumiere' || l === 'lumière') return 'lumiere';
  return 'neutre';
}

function mapToEventCategory(s: string): EventCategory {
  const normalized = s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');
  for (const c of EVENT_CATEGORIES) {
    if (c === normalized || c.replace(/_/g, '') === normalized.replace(/_/g, '')) {
      return c;
    }
  }
  if (['armed', 'conflict', 'violence', 'strike', 'security'].some((k) => normalized.includes(k))) {
    return 'armed_conflict';
  }
  if (['culture', 'festival', 'concert', 'art'].some((k) => normalized.includes(k))) {
    return 'cultural_event';
  }
  if (['economy', 'crisis', 'collapse'].some((k) => normalized.includes(k))) {
    return 'economic_crisis';
  }
  if (['politics', 'government', 'tension'].some((k) => normalized.includes(k))) {
    return 'political_tension';
  }
  if (['reconstruction', 'rebuild', 'aid'].some((k) => normalized.includes(k))) {
    return 'reconstruction';
  }
  return 'neutral';
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
