/**
 * Worker classification — pre-classifier first, then Claude Haiku for ambiguous, else ensemble.
 */

import { preClassify } from '@/core/classification';
import { classify as coreClassify } from '@/core/classification';
import type { LebanonEvent, Severity } from '@/types/events';
import type { EventCategory } from '@/types/events';

function inferSeverity(title: string): Severity {
  const lower = title.toLowerCase();

  const critical = [
    'airstrike', 'airstrikes', 'bombing', 'bombed', 'massacre', 'invasion',
    'ground operation', 'killed', 'death toll', 'casualties', 'dead',
    'frappe', 'frappes', 'bombardement', 'tué', 'tués', 'mort', 'morts',
    'massacre', 'invasion', 'opération terrestre',
    'غارة', 'غارات', 'قصف', 'قتل', 'قتلى', 'شهداء', 'مجزرة', 'اجتياح',
    'air raid', 'missile strike', 'shelling',
  ];

  const high = [
    'attack', 'attacked', 'explosion', 'blast', 'wounded', 'injured',
    'displaced', 'evacuation', 'assassination', 'military operation',
    'attentat', 'explosion', 'blessé', 'blessés', 'déplacé', 'évacuation',
    'assassinat', 'opération militaire',
    'تفجير', 'انفجار', 'جريح', 'جرحى', 'نزوح', 'اغتيال', 'عملية عسكرية',
    'rocket', 'missiles', 'roquette', 'صاروخ', 'صواريخ',
  ];

  const medium = [
    'protest', 'clash', 'tension', 'crisis', 'violation', 'threat',
    'manifestation', 'affrontement', 'crise', 'violation', 'menace',
    'احتجاج', 'اشتباك', 'أزمة', 'تهديد',
    'sanctions', 'embargo', 'blockade',
  ];

  if (critical.some(k => lower.includes(k))) return 'critical';
  if (high.some(k => lower.includes(k))) return 'high';
  if (medium.some(k => lower.includes(k))) return 'medium';
  return 'low';
}

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
      severity: inferSeverity(event.title),
    };
  }

  const result = coreClassify(event.title, { tone });

  return {
    ...event,
    classification: result.classification,
    confidence: result.confidence,
    category: result.category,
    severity: inferSeverity(event.title),
  };
}

/**
 * Returns true if pre-classifier cannot decide (needs LLM).
 */
export function needsLlmClassification(title: string): boolean {
  return preClassify(title) === null;
}
