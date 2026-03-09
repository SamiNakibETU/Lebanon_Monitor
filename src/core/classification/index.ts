/**
 * Main classification pipeline: pre-classifier → keywords → tone → ensemble.
 */

import type { ClassificationResult, EventCategory } from '../types';
import { preClassify, inferOmbreCategory, inferLumiereCategory } from './pre-classifier';
import { scoreByKeywords } from './keyword-scorer';
import { mapTone } from './tone-mapper';

export interface ClassifyOptions {
  tone?: number;
  hfResult?: { label: string; score: number };
}

function mapHfResult(result: { label: string; score: number }): {
  ombreScore: number;
  lumiereScore: number;
} {
  const label = result.label.toLowerCase();
  if (
    label === 'negative' ||
    label === 'neg' ||
    label.includes('1') ||
    label.includes('2')
  ) {
    return { ombreScore: result.score, lumiereScore: 0 };
  }
  if (
    label === 'positive' ||
    label === 'pos' ||
    label.includes('4') ||
    label.includes('5')
  ) {
    return { ombreScore: 0, lumiereScore: result.score };
  }
  return { ombreScore: 0.3, lumiereScore: 0.3 };
}

/**
 * Classifies event text into lumiere / ombre / neutre.
 * @param text - Headline or event title
 * @param options - Optional tone (GDELT) and HF sentiment
 */
export function classify(text: string, options: ClassifyOptions = {}): ClassificationResult {
  const pre = preClassify(text);
  if (pre) return pre;

  const { ombreScore, lumiereScore } = scoreByKeywords(text);

  let finalOmbre = ombreScore * 0.35;
  let finalLumiere = lumiereScore * 0.35;
  let totalWeight = 0.35;

  const toneResult = options.tone != null ? mapTone(options.tone) : null;
  if (toneResult) {
    finalOmbre += toneResult.ombreScore * 0.2;
    finalLumiere += toneResult.lumiereScore * 0.2;
    totalWeight += 0.2;
  }

  const hfScore = options.hfResult ? mapHfResult(options.hfResult) : null;
  if (hfScore) {
    finalOmbre += hfScore.ombreScore * 0.45;
    finalLumiere += hfScore.lumiereScore * 0.45;
    totalWeight += 0.45;
  }

  finalOmbre /= totalWeight;
  finalLumiere /= totalWeight;

  if (finalOmbre > finalLumiere && finalOmbre > 0.15) {
    return {
      classification: 'ombre',
      confidence: Math.min(finalOmbre + 0.3, 1),
      category: inferOmbreCategory(text.toLowerCase()),
      method: 'ensemble',
    };
  }

  if (finalLumiere > finalOmbre && finalLumiere > 0.15) {
    return {
      classification: 'lumiere',
      confidence: Math.min(finalLumiere + 0.3, 1),
      category: inferLumiereCategory(text.toLowerCase()),
      method: 'ensemble',
    };
  }

  return {
    classification: 'neutre',
    confidence: 0.5,
    category: 'neutral' as EventCategory,
    method: 'ensemble',
  };
}

export { preClassify } from './pre-classifier';
export { scoreByKeywords } from './keyword-scorer';
export { mapTone } from './tone-mapper';
