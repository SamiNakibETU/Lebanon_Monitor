/**
 * Shared Lumière/Ombre classification logic.
 */

import type { Classification, EventCategory } from '@/types/events';
import { getAllLumiereKeywords, getAllOmbreKeywords } from './keywords';

export interface ClassificationResult {
  classification: Classification;
  confidence: number;
  category: EventCategory;
}

const LUMIERE_KEYWORDS = getAllLumiereKeywords();
const OMBRE_KEYWORDS = getAllOmbreKeywords();

/**
 * Classify text using keyword matching.
 */
export function classifyByKeywords(text: string): ClassificationResult {
  const lower = text.toLowerCase();
  let lumiereScore = 0;
  let ombreScore = 0;

  for (const kw of LUMIERE_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) lumiereScore++;
  }
  for (const kw of OMBRE_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) ombreScore++;
  }

  const total = lumiereScore + ombreScore;
  if (total === 0) {
    return {
      classification: 'neutre',
      confidence: 0.5,
      category: 'neutral',
    };
  }

  if (lumiereScore > ombreScore) {
    const confidence = Math.min(0.5 + (lumiereScore - ombreScore) * 0.15, 1);
    return {
      classification: 'lumiere',
      confidence,
      category: 'institutional_progress',
    };
  }
  if (ombreScore > lumiereScore) {
    const confidence = Math.min(0.5 + (ombreScore - lumiereScore) * 0.15, 1);
    return {
      classification: 'ombre',
      confidence,
      category: 'political_tension',
    };
  }

  return {
    classification: 'neutre',
    confidence: 0.5,
    category: 'neutral',
  };
}

/**
 * Map GDELT tone score (-100 to +100) to classification.
 */
export function classifyByTone(tone: number): ClassificationResult {
  if (tone > 3) {
    const confidence = Math.min(Math.abs(tone) / 10, 1);
    return { classification: 'lumiere', confidence, category: 'institutional_progress' };
  }
  if (tone < -3) {
    const confidence = Math.min(Math.abs(tone) / 10, 1);
    return { classification: 'ombre', confidence, category: 'political_tension' };
  }
  return {
    classification: 'neutre',
    confidence: 0.5,
    category: 'neutral',
  };
}
