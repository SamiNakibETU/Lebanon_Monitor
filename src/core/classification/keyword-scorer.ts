/**
 * Dictionary-based keyword scoring for ombre/lumière classification.
 */

import { OMBRE_AR } from './dictionaries/ombre-ar';
import { OMBRE_FR } from './dictionaries/ombre-fr';
import { OMBRE_EN } from './dictionaries/ombre-en';
import { LUMIERE_AR } from './dictionaries/lumiere-ar';
import { LUMIERE_FR } from './dictionaries/lumiere-fr';
import { LUMIERE_EN } from './dictionaries/lumiere-en';

const ALL_OMBRE = [...OMBRE_AR, ...OMBRE_FR, ...OMBRE_EN];
const ALL_LUMIERE = [...LUMIERE_AR, ...LUMIERE_FR, ...LUMIERE_EN];

export interface KeywordScores {
  ombreScore: number;
  lumiereScore: number;
  ombreMatches: string[];
  lumiereMatches: string[];
}

/**
 * Scores text against ombre and lumiere dictionaries.
 * @param text - Raw headline or event title
 * @returns Scores (0-1) and matched keywords
 */
export function scoreByKeywords(text: string): KeywordScores {
  const lower = text.toLowerCase();
  const ombreMatches = ALL_OMBRE.filter((kw) => lower.includes(kw.toLowerCase()));
  const lumiereMatches = ALL_LUMIERE.filter((kw) => lower.includes(kw.toLowerCase()));

  const ombreScore = Math.min(ombreMatches.length / 3, 1);
  const lumiereScore = Math.min(lumiereMatches.length / 3, 1);

  return { ombreScore, lumiereScore, ombreMatches, lumiereMatches };
}
