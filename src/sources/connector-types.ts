/**
 * Interface commune pour les connecteurs de sources.
 * Phase C — Pipeline ingestion.
 */

import type { LebanonEvent } from '@/types/events';

export type SourceStatusValue =
  | 'ok'
  | 'error'
  | 'rate-limited'
  | 'no-data'
  | 'skipped';

export type SourceReliability = 'high' | 'medium' | 'low';
export type CostClass = 'free' | 'low' | 'medium' | 'high';
export type SourceCategory =
  | 'news'
  | 'humanitarian'
  | 'geophysical'
  | 'economy'
  | 'connectivity'
  | 'social'
  | 'indicators'
  | 'conflict';

export interface FetchResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: { source: string; message: string };
  status: SourceStatusValue;
  responseTimeMs?: number;
  cached?: boolean;
  warnings?: string[];
}

export interface HealthStatus {
  ok: boolean;
  responseTimeMs?: number;
  itemCount?: number;
  error?: string;
}

export interface SourceConnectorMeta {
  name: string;
  category: SourceCategory;
  eventSource: boolean;
  indicatorSource: boolean;
  getTTL: () => number;
  getRateLimitHints: () => { requestsPerMinute?: number; minIntervalMs?: number };
  getSourceReliability: () => SourceReliability;
  getCostClass: () => CostClass;
}

export interface SourceConnector<T = unknown> extends SourceConnectorMeta {
  fetch: () => Promise<FetchResult<T>>;
  normalize: (raw: T, fetchedAt: Date) => LebanonEvent[];
}

export type ConnectorDescriptor = SourceConnectorMeta & {
  fetch: () => Promise<FetchResult<unknown>>;
  normalize: (raw: unknown, fetchedAt: Date) => LebanonEvent[];
};
