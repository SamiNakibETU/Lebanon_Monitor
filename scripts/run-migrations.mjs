#!/usr/bin/env node
/**
 * Run database migrations.
 * Usage: node scripts/run-migrations.mjs
 * Requires: DATABASE_URL in environment (use .env.local or export)
 */

import { readdir, readFile } from 'fs/promises';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local if present
const envPath = join(__dirname, '..', '.env.local');
if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}
const MIGRATIONS_DIR = join(__dirname, '..', 'src', 'db', 'migrations');

async function getMigrationFiles() {
  const files = await readdir(MIGRATIONS_DIR);
  return files.filter((f) => f.endsWith('.sql')).sort();
}

async function runMigration(client, filename) {
  const path = join(MIGRATIONS_DIR, filename);
  const sql = await readFile(path, 'utf-8');
  await client.query(sql);
}

async function main() {
  const url =
    process.env.DATABASE_URL ||
    process.env.DATABASE_PUBLIC_URL ||
    process.env.DATABASE_PRIVATE_URL;
  if (!url) {
    console.error('DATABASE_URL or DATABASE_PUBLIC_URL is not set');
    process.exit(1);
  }

  const isInternal = url.includes('railway.internal');
  let connUrl = url;
  if (!isInternal) {
    connUrl = url
      .replace(/[?&]sslmode=[^&]*/g, '')
      .replace(/[?&]uselibpqcompat=[^&]*/g, '')
      .replace(/\?&/g, '?')
      .replace(/\?$/g, '');
  }
  const pool = new pg.Pool({
    connectionString: connUrl,
    ssl: isInternal ? false : (url.includes('railway') ? { rejectUnauthorized: false } : undefined),
  });
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const { rows: applied } = await client.query('SELECT filename FROM _migrations ORDER BY id');
    const appliedSet = new Set(applied.map((r) => r.filename));

    const files = await getMigrationFiles();
    const toApply = files.filter((f) => !appliedSet.has(f));

    if (toApply.length === 0) {
      console.log('No pending migrations.');
      return;
    }

    for (const f of toApply) {
      console.log('Applying:', f);
      await runMigration(client, f);
      await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [f]);
    }
    console.log('Migrations applied:', toApply.length);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
