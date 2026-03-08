/**
 * PostgreSQL client for Lebanon Monitor.
 * Uses pg with connection pooling.
 */

import { Pool, type PoolClient } from 'pg';

let pool: Pool | null = null;

/**
 * Resolve DB URL.
 * - On Railway: prefer DATABASE_URL (internal ref) or DATABASE_PRIVATE_URL.
 * - External (local migrations): prefer DATABASE_PUBLIC_URL (proxy rlwy.net).
 * Internal = postgres.railway.internal, avoids ENOTFOUND when resolving.
 */
function getConnectionUrl(): string {
  const publicUrl = process.env.DATABASE_PUBLIC_URL;
  const privateUrl = process.env.DATABASE_PRIVATE_URL;
  const url = process.env.DATABASE_URL;
  // If we have internal URL (Railway network), use it first for perf
  if (url && url.includes('railway.internal')) return url;
  if (privateUrl && privateUrl.includes('railway.internal')) return privateUrl;
  // Else use whatever is available (public for external, or same URL)
  if (url) return url;
  if (privateUrl) return privateUrl;
  if (publicUrl) return publicUrl;
  throw new Error('DATABASE_URL, DATABASE_PUBLIC_URL or DATABASE_PRIVATE_URL is not set');
}

/**
 * Get or create the database pool.
 */
export function getPool(): Pool {
  if (!pool) {
    let url = getConnectionUrl();
    const isInternal = url.includes('railway.internal');
    const sslConfig = isInternal
      ? false
      : { rejectUnauthorized: false };
    // For public URLs: strip sslmode from URL — pg treats sslmode=require as verify-full and overrides
    // our rejectUnauthorized. We rely only on ssl: { rejectUnauthorized: false } for Railway's proxy.
    if (!isInternal) {
      url = url
        .replace(/[?&]sslmode=[^&]*/g, '')
        .replace(/[?&]uselibpqcompat=[^&]*/g, '')
        .replace(/\?&/, '?')
        .replace(/\?$/, '');
    }
    pool = new Pool({
      connectionString: url,
      ssl: sslConfig,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    });
  }
  return pool;
}

/**
 * Execute a query with automatic client release.
 */
export async function withClient<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const p = getPool();
  const client = await p.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

/**
 * Check if database is reachable.
 * Returns { ok, error } for debugging when disconnected.
 */
export async function healthCheck(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  try {
    const p = getPool();
    const client = await p.connect();
    await client.query('SELECT 1');
    client.release();
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const code = e instanceof Error && 'code' in e ? (e as NodeJS.ErrnoException).code : '';
    const hint = code || msg.slice(0, 80);
    return { ok: false, error: hint };
  }
}

/**
 * Close the pool (for graceful shutdown).
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
