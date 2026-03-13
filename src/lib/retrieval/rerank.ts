/**
 * Rerank — simple scoring for retrieval results.
 * Recency + source diversity. No embeddings.
 */

export interface RerankableEvent {
  id: string;
  occurredAt?: Date | string;
  occurred_at?: Date | string;
  sourceCount?: number;
}

export function scoreEvent(ev: RerankableEvent): number {
  const at = ev.occurredAt ?? ev.occurred_at;
  const age = at ? (Date.now() - new Date(at).getTime()) / (1000 * 60 * 60 * 24) : 999;
  const recencyScore = Math.max(0, 100 - age * 5);
  const sourceScore = Math.min(30, (ev.sourceCount ?? 1) * 10);
  return recencyScore + sourceScore;
}

export function rerankEvents<T extends RerankableEvent>(events: T[]): T[] {
  return [...events].sort((a, b) => scoreEvent(b) - scoreEvent(a));
}
