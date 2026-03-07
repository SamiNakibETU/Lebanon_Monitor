/**
 * Event observation repository tests.
 * getObservationCountByEventIds: 0 ids returns empty Map without DB.
 * With DB: requires DATABASE_URL.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getPool, withClient } from '../client';
import { getObservationCountByEventIds } from '../repositories/event-observation-repository';

const hasDb = !!process.env.DATABASE_URL;

describe('event-observation-repository', () => {
  afterAll(async () => {
    if (hasDb) {
      const pool = getPool();
      await pool.end();
    }
  });

  it('getObservationCountByEventIds returns empty Map for empty array', async () => {
    if (!hasDb) {
      const { Pool } = await import('pg');
      const mockClient = {
        query: async () => ({ rows: [] }),
      } as unknown as import('pg').PoolClient;
      const map = await getObservationCountByEventIds(mockClient, []);
      expect(map.size).toBe(0);
      return;
    }

    const map = await withClient((client) => getObservationCountByEventIds(client, []));
    expect(map.size).toBe(0);
  });

  it('getObservationCountByEventIds returns Map for non-existent event ids', async () => {
    if (!hasDb) return;

    const fakeId = '00000000-0000-0000-0000-000000000000';
    const map = await withClient((client) =>
      getObservationCountByEventIds(client, [fakeId])
    );
    expect(map.size).toBe(0);
  });
});
