/**
 * Minimal contradiction detection for claims.
 * Phase 2 — incompatible numbers, negation vs number.
 */

export interface ClaimForDetection {
  id: string;
  text: string;
  claim_type: string | null;
}

export interface DetectedContradiction {
  claim_id_a: string;
  claim_id_b: string;
  contradiction_type: 'direct' | 'partial';
}

const FATALITY_NUMBER = /\b(\d+)\s*(?:morts?|killed|dead|décédés?|fatalities)\b|\b(?:morts?|killed|dead)\s*:\s*(\d+)\b/i;
const INJURY_NUMBER = /\b(\d+)\s*(?:blessés?|injured|wounded)\b|\b(?:blessés?|injured)\s*:\s*(\d+)\b/i;
const NEGATION =
  /\b(?:aucun|aucune|zero|zéro|pas de|no |none|ninguno|ni mort|ni blessé|aucun mort|aucun blessé)\b/i;

function extractNumber(text: string, type: 'fatality' | 'injury'): number | null {
  const re = type === 'fatality' ? FATALITY_NUMBER : INJURY_NUMBER;
  const m = text.match(re);
  if (!m) return null;
  const n = parseInt(m[1] ?? m[2] ?? '0', 10);
  return Number.isNaN(n) ? null : n;
}

function hasNegation(text: string, type: 'fatality' | 'injury'): boolean {
  if (!NEGATION.test(text)) return false;
  const lower = text.toLowerCase();
  if (type === 'fatality') {
    return /mort|killed|dead|décédé|fatality/i.test(lower);
  }
  return /blessé|injured|wounded/i.test(lower);
}

/**
 * Detect contradictions between claims of the same event.
 */
export function detectContradictions(
  claims: ClaimForDetection[]
): DetectedContradiction[] {
  const result: DetectedContradiction[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < claims.length; i++) {
    for (let j = i + 1; j < claims.length; j++) {
      const a = claims[i];
      const b = claims[j];
      const pairKey = [a.id, b.id].sort().join('|');
      if (seen.has(pairKey)) continue;

      const typeA = a.claim_type;
      const typeB = b.claim_type;

      if (typeA === 'fatality' && typeB === 'fatality') {
        const na = extractNumber(a.text, 'fatality');
        const nb = extractNumber(b.text, 'fatality');
        if (na != null && nb != null && na !== nb) {
          seen.add(pairKey);
          result.push({ claim_id_a: a.id, claim_id_b: b.id, contradiction_type: 'direct' });
        } else if (hasNegation(a.text, 'fatality') && nb != null && nb > 0) {
          seen.add(pairKey);
          result.push({ claim_id_a: a.id, claim_id_b: b.id, contradiction_type: 'direct' });
        } else if (hasNegation(b.text, 'fatality') && na != null && na > 0) {
          seen.add(pairKey);
          result.push({ claim_id_a: a.id, claim_id_b: b.id, contradiction_type: 'direct' });
        }
      } else if (typeA === 'injury' && typeB === 'injury') {
        const na = extractNumber(a.text, 'injury');
        const nb = extractNumber(b.text, 'injury');
        if (na != null && nb != null && na !== nb) {
          seen.add(pairKey);
          result.push({ claim_id_a: a.id, claim_id_b: b.id, contradiction_type: 'direct' });
        } else if (hasNegation(a.text, 'injury') && nb != null && nb > 0) {
          seen.add(pairKey);
          result.push({ claim_id_a: a.id, claim_id_b: b.id, contradiction_type: 'direct' });
        } else if (hasNegation(b.text, 'injury') && na != null && na > 0) {
          seen.add(pairKey);
          result.push({ claim_id_a: a.id, claim_id_b: b.id, contradiction_type: 'direct' });
        }
      }
    }
  }
  return result;
}
