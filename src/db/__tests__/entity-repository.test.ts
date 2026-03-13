/**
 * Entity (actor) repository tests.
 * Run with: npm test -- src/db/__tests__/entity-repository.test.ts
 * Requires DATABASE_URL for integration tests. Skip if not set.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getPool, withClient } from '../client';
import { getEntityById, searchEntities } from '../repositories/entity-repository';

const hasDb = !!process.env.DATABASE_URL;

describe('entity-repository', () => {
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

  it('getEntityById returns null for non-existent id', async () => {
    if (!hasDb) return;

    const entity = await withClient((client) =>
      getEntityById(client, '00000000-0000-0000-0000-000000000000')
    );
    expect(entity).toBeNull();
  });

  it('searchEntities returns entities with default pagination', async () => {
    if (!hasDb) return;

    const { entities, total } = await withClient((client) =>
      searchEntities(client, { limit: 5 })
    );
    expect(Array.isArray(entities)).toBe(true);
    expect(typeof total).toBe('number');
    expect(entities.length).toBeLessThanOrEqual(5);
  });
});
