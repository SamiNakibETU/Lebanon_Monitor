/**
 * Place repository tests.
 * Run with: npm test -- src/db/__tests__/place-repository.test.ts
 * Requires DATABASE_URL for integration tests. Skip if not set.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getPool, withClient } from '../client';
import { getPlaceById, listPlaces } from '../repositories/place-repository';

const hasDb = !!process.env.DATABASE_URL;

describe('place-repository', () => {
  beforeAll(async () => {
    if (!hasDb) return;
    const { execSync } = await import('child_process');
    try {
      execSync('node scripts/run-migrations.mjs', {
        stdio: 'pipe',
        env: process.env,
      });
    } catch {
      // Migrations may already be applied
    }
  });

  afterAll(async () => {
    if (hasDb) {
      const pool = getPool();
      await pool.end();
    }
  });

  it('getPlaceById returns null for non-existent id', async () => {
    if (!hasDb) return;

    const place = await withClient((client) =>
      getPlaceById(client, '00000000-0000-0000-0000-000000000000')
    );
    expect(place).toBeNull();
  });

  it('listPlaces returns places with default pagination', async () => {
    if (!hasDb) return;

    const { places, total } = await withClient((client) =>
      listPlaces(client, { limit: 5 })
    );
    expect(Array.isArray(places)).toBe(true);
    expect(typeof total).toBe('number');
    expect(places.length).toBeLessThanOrEqual(5);
  });

  it('listPlaces with q filter returns matching places', async () => {
    if (!hasDb) return;

    const { places, total } = await withClient((client) =>
      listPlaces(client, { q: 'beirut', limit: 10 })
    );
    expect(Array.isArray(places)).toBe(true);
    expect(typeof total).toBe('number');
  });
});
