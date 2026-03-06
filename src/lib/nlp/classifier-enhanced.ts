/**
 * Enhanced ensemble classifier: preClassify → keywords 0.3 + HF 0.5 + tone 0.2.
 * Pre-classifier catches hard ombre/lumière cases BEFORE the ensemble.
 */

import type { Classification, EventCategory } from '@/types/events';
import { HARD_OMBRE_KEYWORDS, HARD_LUMIERE_KEYWORDS } from '@/lib/classification/keywords';
import { classifyByKeywords } from '@/lib/classification/classifier';
import { classifyWithHF } from './huggingface';

export interface EnhancedClassificationInput {
  title: string;
  gdeltTone?: number;
  /** When false, skip HF API and use keywords + tone only. */
  useHf?: boolean;
}

export interface EnhancedClassificationResult {
  classification: Classification;
  confidence: number;
  category: EventCategory;
}

function toScore(c: Classification): number {
  if (c === 'lumiere') return 1;
  if (c === 'ombre') return -1;
  return 0;
}

function fromScore(s: number): Classification {
  if (s > 0.1) return 'lumiere';
  if (s < -0.1) return 'ombre';
  return 'neutre';
}

/**
 * Pre-classifier: if hard ombre/lumière keywords found, return immediately.
 * Catches ~60% of Lebanese events (bombing, military, festivals, etc.).
 */
function preClassify(text: string): EnhancedClassificationResult | null {
  const lower = text.toLowerCase();

  for (const kw of HARD_OMBRE_KEYWORDS) {
    if (lower.includes(kw)) {
      return {
        classification: 'ombre',
        confidence: 0.95,
        category: 'armed_conflict',
      };
    }
  }

  for (const kw of HARD_LUMIERE_KEYWORDS) {
    if (lower.includes(kw)) {
      return {
        classification: 'lumiere',
        confidence: 0.9,
        category: 'cultural_event',
      };
    }
  }

  return null;
}

/**
 * Default category when no specific match: based on classification.
 */
function defaultCategoryFor(classification: Classification): EventCategory {
  if (classification === 'ombre') return 'political_tension';
  if (classification === 'lumiere') return 'institutional_progress';
  return 'neutral';
}

/**
 * Ensemble classification with optional HF sentiment.
 * Step 1: preClassify (hard keywords) → if match, return.
 * Step 2: ensemble (keywords + HF + tone).
 */
export async function classifyEnhanced(
  input: EnhancedClassificationInput
): Promise<EnhancedClassificationResult> {
  const { title, gdeltTone, useHf = true } = input;

  const pre = preClassify(title);
  if (pre) return pre;

  const kw = classifyByKeywords(title);
  const kwScore = toScore(kw.classification) * kw.confidence;

  let hfScore = 0;
  const hf = useHf ? await classifyWithHF(title) : null;
  if (hf) {
    hfScore = toScore(hf.label) * hf.score;
  }

  const toneScore =
    gdeltTone != null
      ? Math.max(-1, Math.min(1, gdeltTone / 100))
      : 0;

  let finalScore: number;
  let confidence: number;

  if (hf) {
    finalScore = kwScore * 0.3 + hfScore * 0.5 + toneScore * 0.2;
    confidence = kw.confidence * 0.3 + (hf ? hf.score : 0.5) * 0.5 + 0.5 * 0.2;
  } else {
    finalScore = kwScore * 0.6 + toneScore * 0.4;
    confidence = kw.confidence * 0.6 + 0.5 * 0.4;
  }

  confidence = Math.min(1, Math.max(0.3, confidence));

  const classification = fromScore(finalScore);

  const category = defaultCategoryFor(classification);

  return {
    classification,
    confidence,
    category,
  };
}
