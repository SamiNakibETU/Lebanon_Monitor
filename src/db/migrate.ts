/**
 * Migration runner for Lebanon Monitor.
 * Runs SQL files in order from src/db/migrations/.
 */

import type { PoolClient } from 'pg';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { getPool } from './client';

const MIGRATIONS_DIR = join(process.cwd(), 'src', 'db', 'migrations');

async function getMigrationFiles(): Promise<string[]> {
  const files = await readdir(MIGRATIONS_DIR);
  return files
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

async function runMigration(client: PoolClient, filename: string): Promise<void> {
  const path = join(MIGRATIONS_DIR, filename);
  const sql = await readFile(path, 'utf-8');
  await client.query(sql);
}

/**
 * Run all pending migrations.
 */
export async function migrate(): Promise<{ applied: string[]; skipped: string[] }> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const { rows: applied } = await client.query<{ filename: string }>(
      'SELECT filename FROM _migrations ORDER BY id'
    );
    const appliedSet = new Set(applied.map((r) => r.filename));

    const files = await getMigrationFiles();
    const toApply = files.filter((f) => !appliedSet.has(f));
    const skipped = files.filter((f) => appliedSet.has(f));

    for (const f of toApply) {
      await runMigration(client, f);
      await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [f]);
    }

    return { applied: toApply, skipped };
  } finally {
    client.release();
  }
}
