/**
 * Heuristic language detection for Lebanese content (ar / fr / en).
 * Uses script and common word patterns.
 */

export type DetectedLanguage = 'ar' | 'fr' | 'en';

/** Common French words in Lebanese context */
const FR_MARKERS = [
  /\b(le|la|les|un|une|des|et|ou|mais|pour|dans|avec|sur|par|sont|est|sont)\b/i,
  /\b(beirut|beyrouth|liban|libanais|libanaise)\b/i,
  /\b(gouvernement|président|ministre|réforme|accord)\b/i,
  /\b(inauguration|festival|reconstruction|solidarité)\b/i,
];

/** Common English words in Lebanese context */
const EN_MARKERS = [
  /\b(the|and|or|but|for|in|with|on|by|is|are|was|were)\b/i,
  /\b(beirut|lebanon|lebanese)\b/i,
  /\b(government|president|minister|reform|agreement)\b/i,
  /\b(airstrike|strike|attack|killed|bombing|shelling)\b/i,
];

/**
 * Detects primary language of text using heuristics.
 * Priority: Arabic script → French markers → English markers → default 'en'.
 */
export function detectLanguage(text: string): DetectedLanguage {
  const trimmed = text.trim();
  if (!trimmed) return 'en';

  const arCount = (trimmed.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) || []).length;
  if (arCount >= 2) return 'ar';

  let frScore = 0;
  let enScore = 0;
  for (const re of FR_MARKERS) {
    if (re.test(trimmed)) frScore++;
  }
  for (const re of EN_MARKERS) {
    if (re.test(trimmed)) enScore++;
  }

  if (frScore > enScore) return 'fr';
  if (enScore > 0 || trimmed.length > 0) return 'en';
  return 'en';
}
