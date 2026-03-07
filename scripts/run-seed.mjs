#!/usr/bin/env node
/**
 * Run database seed (taxonomy, etc.).
 * Usage: node scripts/run-seed.mjs (loads .env.local automatically)
 */

import { readFile } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
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
const SEED_DIR = join(__dirname, '..', 'src', 'db', 'seed');
const SEED_FILES = ['001_taxonomy.sql', '002_places.sql'];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: url });
  const client = await pool.connect();

  try {
    await client.query("SET client_encoding TO 'UTF8'");
    for (const file of SEED_FILES) {
      const sql = await readFile(join(SEED_DIR, file), 'utf-8');
      await client.query(sql);
      console.log(`Seed applied: ${file}`);
    }
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
