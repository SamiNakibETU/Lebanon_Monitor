/**
 * Rule-based claim extraction from event title/summary.
 * Phase 2 — minimal extraction for provenance and future claim graph.
 */

export interface ExtractedClaim {
  text: string;
  type?: 'fatality' | 'injury' | 'location_action' | 'general';
  confidence: number;
}

const FATALITY_PATTERNS = [
  /\b(\d+)\s*(?:morts?|killed|dead|décédés?|fatalities)\b/gi,
  /\b(?:morts?|killed|dead)\s*:\s*(\d+)\b/gi,
];

const INJURY_PATTERNS = [
  /\b(\d+)\s*(?:blessés?|injured|wounded)\b/gi,
  /\b(?:blessés?|injured)\s*:\s*(\d+)\b/gi,
];

/**
 * Extract factual claims from text using regex patterns.
 */
export function extractClaims(title: string, summary?: string | null): ExtractedClaim[] {
  const claims: ExtractedClaim[] = [];
  const text = [title, summary].filter(Boolean).join(' ');
  if (!text.trim()) return claims;

  const seen = new Set<string>();

  function addClaim(text: string, type: ExtractedClaim['type'], confidence: number) {
    const norm = text.slice(0, 200).trim().toLowerCase();
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      claims.push({ text: text.slice(0, 500).trim(), type, confidence });
    }
  }

  for (const re of FATALITY_PATTERNS) {
    const m = text.match(re);
    if (m) {
      for (const match of m) {
        addClaim(match, 'fatality', 0.85);
      }
    }
  }

  for (const re of INJURY_PATTERNS) {
    const m = text.match(re);
    if (m) {
      for (const match of m) {
        addClaim(match, 'injury', 0.8);
      }
    }
  }

  if (claims.length === 0 && title.length > 15) {
    addClaim(title, 'general', 0.6);
  }

  return claims;
}
