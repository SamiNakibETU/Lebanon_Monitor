/**
 * PostgreSQL client for Lebanon Monitor.
 * Uses pg with connection pooling.
 */

import { Pool, type PoolClient } from 'pg';

let pool: Pool | null = null;

/**
 * Resolve DB URL. Prefer DATABASE_PUBLIC_URL when set (avoids ENOTFOUND with
 * postgres.railway.internal). Else use DATABASE_PRIVATE_URL or DATABASE_URL.
 */
function getConnectionUrl(): string {
  const publicUrl = process.env.DATABASE_PUBLIC_URL;
  const privateUrl = process.env.DATABASE_PRIVATE_URL;
  const url = process.env.DATABASE_URL;
  if (publicUrl) return publicUrl;
  if (privateUrl) return privateUrl;
  if (url) return url;
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
    if (!isInternal && !url.includes('sslmode=')) {
      const sep = url.includes('?') ? '&' : '?';
      // uselibpqcompat=true: sslmode=require = use SSL without cert verification (avoids SELF_SIGNED_CERT_IN_CHAIN with Railway proxy)
      url = `${url}${sep}uselibpqcompat=true&sslmode=require`;
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
