/**
 * Worker classification — pre-classifier first, then Claude Haiku for ambiguous, else ensemble.
 */

import { preClassify } from '@/core/classification';
import { classify as coreClassify } from '@/core/classification';
import type { LebanonEvent } from '@/types/events';
import type { EventCategory } from '@/types/events';

/**
 * Classify single event. Pre-classifier first; if null, uses ensemble (LLM used in pipeline batch).
 */
export function classifyEvent(event: LebanonEvent): LebanonEvent {
  const tone =
    event.source === 'gdelt' &&
    event.rawData &&
    typeof (event.rawData as { tone?: number }).tone === 'number'
      ? (event.rawData as { tone: number }).tone
      : undefined;

  const pre = preClassify(event.title);
  if (pre) {
    return {
      ...event,
      classification: pre.classification,
      confidence: pre.confidence,
      category: pre.category as EventCategory,
    };
  }

  const result = coreClassify(event.title, { tone });

  return {
    ...event,
    classification: result.classification,
    confidence: result.confidence,
    category: result.category,
  };
}

/**
 * Returns true if pre-classifier cannot decide (needs LLM).
 */
export function needsLlmClassification(title: string): boolean {
  return preClassify(title) === null;
}
