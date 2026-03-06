/**
 * PostgreSQL client for Lebanon Monitor.
 * Uses pg with connection pooling.
 */

import { Pool, type PoolClient } from 'pg';

let pool: Pool | null = null;

/**
 * Get or create the database pool.
 * Uses DATABASE_URL from environment.
 */
export function getPool(): Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL is not set');
    }
    pool = new Pool({
      connectionString: url,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
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
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const p = getPool();
    const client = await p.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch {
    return false;
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
