/**
 * Global cache layer — wraps Redis for all API routes.
 * Pattern: check cache → fetch if miss → store → stale fallback on error.
 */

import { redisGet, redisSet, isRedisConfigured } from './redis';

const NEG_SENTINEL = '__LM_NEG__';
const NEG_TTL = 60;

interface CacheOptions {
  ttl: number;
}

export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  opts: CacheOptions
): Promise<T | null> {
  if (!isRedisConfigured()) {
    return fetcher();
  }

  const cached = await redisGet<T | typeof NEG_SENTINEL>(key);
  if (cached === NEG_SENTINEL) return null;
  if (cached != null) return cached as T;

  try {
    const fresh = await fetcher();

    if (fresh == null || (Array.isArray(fresh) && fresh.length === 0)) {
      await redisSet(key, NEG_SENTINEL, { ex: NEG_TTL });
      return fresh;
    }

    await redisSet(key, fresh, { ex: opts.ttl });
    return fresh;
  } catch (err) {
    const stale = await redisGet<T>(key);
    if (stale != null && stale !== NEG_SENTINEL) return stale as T;
    throw err;
  }
}
