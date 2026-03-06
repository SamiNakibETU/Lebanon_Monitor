/**
 * Heuristic language detection provider.
 * No external dependency — works offline.
 */

import type { LanguageDetectionProvider, LanguageDetectionResult } from './types';

const ARABIC_RANGE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g;
const FRENCH_WORDS = /\b(le|la|les|de|du|des|et|est|un|une|pour|dans|avec|sur|par|au|aux)\b/i;
const FRENCH_ACCENTS = /[éèêëàâäùûüôöîïç]/i;
const EN_MARKERS = /\b(the|and|or|but|for|in|with|on|by|is|are|was|were)\b/i;

/**
 * Detects language using heuristics.
 * Priority: Arabic script → French markers → English.
 */
function detectSync(text: string): LanguageDetectionResult {
  const trimmed = text.trim();
  if (!trimmed) return { language: 'en', confidence: 0.5 };

  const arMatches = trimmed.match(ARABIC_RANGE);
  const arCount = arMatches?.length ?? 0;
  const arRatio = arCount / trimmed.length;

  if (arRatio > 0.1) {
    return { language: 'ar', confidence: Math.min(0.7 + arRatio * 0.3, 1) };
  }

  if (FRENCH_WORDS.test(trimmed) || FRENCH_ACCENTS.test(trimmed)) {
    return { language: 'fr', confidence: 0.75 };
  }

  if (EN_MARKERS.test(trimmed)) {
    return { language: 'en', confidence: 0.8 };
  }

  return { language: 'en', confidence: 0.5 };
}

export const heuristicLanguageProvider: LanguageDetectionProvider = {
  detect: async (text: string) => detectSync(text),
  detectSync,
};
