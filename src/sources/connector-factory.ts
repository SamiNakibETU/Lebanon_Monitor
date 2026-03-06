/**
 * Factory pour créer des descripteurs de connecteurs à partir des sources existantes.
 */

import type {
  ConnectorDescriptor,
  FetchResult,
  SourceCategory,
  SourceReliability,
  CostClass,
} from './connector-types';
import type { LebanonEvent } from '@/types/events';

export interface CreateConnectorOptions<T> {
  name: string;
  category: SourceCategory;
  eventSource: boolean;
  indicatorSource: boolean;
  ttlSeconds: number;
  reliability: SourceReliability;
  costClass: CostClass;
  rateLimit?: { requestsPerMinute?: number; minIntervalMs?: number };
  fetch: () => Promise<{ ok: true; data: T } | { ok: false; error: { message: string } }>;
  normalize: (raw: T, fetchedAt: Date) => LebanonEvent[];
  isSkipped?: (errorMessage: string) => boolean;
}

/**
 * Crée un descripteur de connecteur standardisé à partir d'une source existante.
 */
export function createConnector<T>(opts: CreateConnectorOptions<T>): ConnectorDescriptor {
  const {
    name,
    category,
    eventSource,
    indicatorSource,
    ttlSeconds,
    reliability,
    costClass,
    rateLimit = {},
    fetch: doFetch,
    normalize,
    isSkipped,
  } = opts;

  return {
    name,
    category,
    eventSource,
    indicatorSource,
    getTTL: () => ttlSeconds,
    getRateLimitHints: () => rateLimit,
    getSourceReliability: () => reliability,
    getCostClass: () => costClass,
    fetch: async (): Promise<FetchResult<unknown>> => {
      const start = Date.now();
      const result = await doFetch();
      const responseTimeMs = Date.now() - start;

      if (result.ok) {
        return {
          ok: true,
          data: result.data as unknown,
          status: 'ok',
          responseTimeMs,
        };
      }

      const skipped = isSkipped?.(result.error.message) ?? false;

      return {
        ok: false,
        error: { source: name, message: result.error.message },
        status: skipped ? 'skipped' : 'error',
        responseTimeMs,
      };
    },
    normalize: (raw: unknown, fetchedAt: Date) => normalize(raw as T, fetchedAt),
  };
}
