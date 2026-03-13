/**
 * Agent guardrails — no uncited facts, explicit uncertainty, caps.
 */

const CITATION_RE = /\[(event|episode|place|actor|claim):[^\]]+\]/g;

/**
 * Check that every factual assertion is backed by at least one citation.
 * Heuristic: if content has substantive sentences, it should reference citations.
 */
export function hasRequiredCitations(content: string, citations: string[]): boolean {
  if (citations.length === 0) return true;
  const refsInContent = content.match(CITATION_RE) ?? [];
  const uniqueInContent = [...new Set(refsInContent)];
  return uniqueInContent.length >= Math.min(1, citations.length);
}

/**
 * Enforce max content length for agent output.
 */
export function truncateContent(content: string, maxChars = 4000): string {
  if (content.length <= maxChars) return content;
  return content.slice(0, maxChars - 3) + '...';
}

/**
 * Require uncertainty section when evidence is partial.
 */
export function shouldIncludeUncertainty(
  citations: string[],
  hasMissingData: boolean,
  truncated: boolean
): boolean {
  return hasMissingData || truncated || citations.length === 0;
}

/**
 * Cap number of citations returned.
 */
export function capCitations(citations: string[], max = 50): string[] {
  return [...new Set(citations)].slice(0, max);
}
