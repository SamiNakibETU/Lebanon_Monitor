/**
 * Jaccard similarity for title comparison in deduplication.
 */

/**
 * Jaccard similarity between two strings (word-level).
 * Returns 0-1. Used to detect near-duplicate titles.
 */
export function jaccardSimilarity(a: string, b: string): number {
  const arrA = a.toLowerCase().split(/\s+/).filter((x) => x.length > 1);
  const arrB = b.toLowerCase().split(/\s+/).filter((x) => x.length > 1);
  const setA = new Set(arrA);
  const setB = new Set(arrB);
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const x of arrA) {
    if (setB.has(x)) intersection++;
  }
  const union = new Set<string>();
  arrA.forEach((x) => union.add(x));
  arrB.forEach((x) => union.add(x));
  return intersection / union.size;
}
