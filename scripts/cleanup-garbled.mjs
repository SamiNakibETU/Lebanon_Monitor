#!/usr/bin/env node
/**
 * Soft-clean garbled events by setting is_active=false.
 * Usage:
 *   DATABASE_URL="postgresql://..." node scripts/cleanup-garbled.mjs
 */

import pg from 'pg';

const { Pool } = pg;

function scoreBadEncoding(s) {
  let score = 0;
  score += (s.match(/�/g) ?? []).length * 4;
  score += (s.match(/Ã|Â|â€|â€™|â€œ|â€\u009d|Ð|Ñ/g) ?? []).length * 2;
  return score;
}

function isProbablyGarbled(input) {
  const s = String(input ?? '').trim();
  if (!s) return true;
  const bad = scoreBadEncoding(s);
  const len = s.length;
  return bad >= 12 || bad / Math.max(len, 1) > 0.15;
}

async function main() {
  const connectionString = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL;
  if (!connectionString) {
    console.error('DATABASE_URL or DATABASE_PUBLIC_URL is required.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const { rows } = await pool.query(
      `SELECT id, canonical_title
       FROM event
       WHERE is_active = true
       ORDER BY occurred_at DESC
       LIMIT 5000`
    );

    const garbledIds = rows
      .filter((r) => isProbablyGarbled(r.canonical_title))
      .map((r) => r.id);

    if (garbledIds.length === 0) {
      console.log('No garbled active events found.');
      return;
    }

    const { rowCount } = await pool.query(
      `UPDATE event
       SET is_active = false, updated_at = now()
       WHERE id = ANY($1::uuid[])`,
      [garbledIds]
    );

    console.log(`Marked ${rowCount ?? garbledIds.length} events as inactive.`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('cleanup-garbled failed:', err);
  process.exit(1);
});
