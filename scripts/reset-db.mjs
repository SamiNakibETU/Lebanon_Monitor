#!/usr/bin/env node
/**
 * Reset Postgres et réappliquer migrations + seed.
 * Utilise quand la base a été créée avec une ancienne migration (PostGIS, etc.).
 *
 * Usage: node scripts/reset-db.mjs
 *        ou: DATABASE_PUBLIC_URL="postgresql://..." node scripts/reset-db.mjs
 *
 * Charge .env.local. Utilise DATABASE_PUBLIC_URL ou DATABASE_URL.
 * ⚠️ ATTENTION: Supprime TOUTES les tables. À utiliser uniquement sur une base de test/dev.
 */
import { readdir, readFile } from 'fs/promises';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));

const envPath = join(__dirname, '..', '.env.local');
if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

const url = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL ou DATABASE_PUBLIC_URL requis.');
  process.exit(1);
}

const MIGRATIONS_DIR = join(__dirname, '..', 'src', 'db', 'migrations');
const SEED_DIR = join(__dirname, '..', 'src', 'db', 'seed');

async function main() {
  const pool = new pg.Pool({
    connectionString: url,
    ssl: url.includes('railway') ? { rejectUnauthorized: false } : undefined,
  });
  const client = await pool.connect();

  try {
    console.log('1. Drop toutes les tables...');
    await client.query(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS "' || quote_ident(r.tablename) || '" CASCADE';
        END LOOP;
      END $$;
    `);
    console.log('   Tables supprimées.');

    console.log('2. Réappliquer les migrations...');
    const migrationFiles = (await readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith('.sql'))
      .sort();
    for (const f of migrationFiles) {
      const sql = await readFile(join(MIGRATIONS_DIR, f), 'utf-8');
      await client.query(sql);
      console.log('   ✓', f);
    }

    console.log('3. Appliquer le seed...');
    await client.query("SET client_encoding TO 'UTF8'");
    for (const f of ['001_taxonomy.sql', '002_places.sql']) {
      const sql = await readFile(join(SEED_DIR, f), 'utf-8');
      await client.query(sql);
      console.log('   ✓', f);
    }

    console.log('\n✅ Base réinitialisée et prête.');
  } catch (err) {
    console.error('Erreur:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
