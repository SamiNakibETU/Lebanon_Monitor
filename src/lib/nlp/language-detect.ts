/**
 * Arabic/French/English language detection.
 * Lebanese content is often mixed; Arabic is prioritized when present.
 */

export type DetectedLanguage = 'ar' | 'fr' | 'en';

const ARABIC_RANGE = /[\u0600-\u06FF]/g;
const FRENCH_WORDS = /\b(le|la|les|de|du|des|et|est|un|une|pour|dans|avec|sur|par|au|aux)\b/i;
const FRENCH_ACCENTS = /[éèêëàâäùûüôöîïç]/i;

/**
 * Detects language from text. Prioritizes Arabic if any Arabic chars present.
 */
export function detectLanguage(text: string): DetectedLanguage {
  if (!text || text.length === 0) return 'en';

  const arabicMatches = text.match(ARABIC_RANGE);
  const arabicCount = arabicMatches?.length ?? 0;
  const arabicRatio = arabicCount / text.length;

  if (arabicRatio > 0.1) return 'ar';

  if (FRENCH_WORDS.test(text) || FRENCH_ACCENTS.test(text)) {
    return 'fr';
  }

  return 'en';
}
