/**
 * In-memory LRU cache for NLP results.
 */

const DEFAULT_MAX = 1000;
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

interface Entry<T> {
  value: T;
  expiresAt: number;
}

export function createLruCache<T>(
  maxSize = DEFAULT_MAX,
  ttlMs = DEFAULT_TTL_MS
): {
  get: (key: string) => T | undefined;
  set: (key: string, value: T) => void;
  has: (key: string) => boolean;
  clear: () => void;
} {
  const map = new Map<string, Entry<T>>();
  const accessOrder: string[] = [];

  function get(key: string): T | undefined {
    const entry = map.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      map.delete(key);
      const idx = accessOrder.indexOf(key);
      if (idx >= 0) accessOrder.splice(idx, 1);
      return undefined;
    }
    // Move to end (most recently used)
    const idx = accessOrder.indexOf(key);
    if (idx >= 0) {
      accessOrder.splice(idx, 1);
      accessOrder.push(key);
    }
    return entry.value;
  }

  function set(key: string, value: T): void {
    if (map.has(key)) {
      const idx = accessOrder.indexOf(key);
      if (idx >= 0) accessOrder.splice(idx, 1);
    } else if (map.size >= maxSize && accessOrder.length > 0) {
      const oldest = accessOrder.shift();
      if (oldest) map.delete(oldest);
    }
    map.set(key, { value, expiresAt: Date.now() + ttlMs });
    accessOrder.push(key);
  }

  function has(key: string): boolean {
    return get(key) !== undefined;
  }

  function clear(): void {
    map.clear();
    accessOrder.length = 0;
  }

  return { get, set, has, clear };
}
