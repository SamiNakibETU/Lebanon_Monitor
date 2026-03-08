/**
 * Upstash Redis client — cache layer for synthesis, indicators, etc.
 * Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
 */

import { Redis } from '@upstash/redis';

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export function isRedisConfigured(): boolean {
  return redis !== null;
}

export async function redisGet<T = unknown>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    if (raw === null) return null;
    return raw as T;
  } catch {
    return null;
  }
}

export async function redisSet(
  key: string,
  value: unknown,
  options?: { ex?: number }
): Promise<boolean> {
  if (!redis) return false;
  try {
    if (options?.ex != null) {
      await redis.set(key, value, { ex: options.ex });
    } else {
      await redis.set(key, value);
    }
    return true;
  } catch {
    return false;
  }
}
