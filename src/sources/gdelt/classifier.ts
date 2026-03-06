/**
 * GDELT-specific Lumière/Ombre classification using tone score.
 */

import { classifyByTone } from '@/lib/classification/classifier';
import type { LebanonEvent } from '@/types/events';

export function classifyGdeltEvent(article: { tone?: number }): {
  classification: LebanonEvent['classification'];
  confidence: number;
  category: LebanonEvent['category'];
} {
  const tone = article.tone ?? 0;
  return classifyByTone(tone);
}
