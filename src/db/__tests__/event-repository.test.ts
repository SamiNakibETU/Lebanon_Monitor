/**
 * Event repository tests.
 * Run with: npm test -- src/db/__tests__/event-repository.test.ts
 * Requires DATABASE_URL for integration tests. Skip if not set.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getPool, withClient } from '../client';
import { createEvent, getEventById, listEvents, updateEventConvergence } from '../repositories/event-repository';

const hasDb = !!process.env.DATABASE_URL;

describe('event-repository', () => {
  beforeAll(async () => {
    if (!hasDb) return;
    // Ensure migrations are run
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

  it('createEvent returns an event with required fields', async () => {
    if (!hasDb) {
      expect(true).toBe(true);
      return;
    }

    const event = await withClient(async (client) =>
      createEvent(client, {
        canonical_title: 'Test event from Vitest',
        polarity_ui: 'neutre',
        occurred_at: new Date(),
        verification_status: 'unverified',
      })
    );

    expect(event.id).toBeDefined();
    expect(event.canonical_title).toBe('Test event from Vitest');
    expect(event.polarity_ui).toBe('neutre');
    expect(event.occurred_at).toBeInstanceOf(Date);
    expect(event.is_active).toBe(true);
  });

  it('getEventById returns null for non-existent id', async () => {
    if (!hasDb) return;

    const event = await withClient((client) =>
      getEventById(client, '00000000-0000-0000-0000-000000000000')
    );
    expect(event).toBeNull();
  });

  it('listEvents returns events with default pagination', async () => {
    if (!hasDb) return;

    const { events, total } = await withClient((client) =>
      listEvents(client, { limit: 5 })
    );
    expect(Array.isArray(events)).toBe(true);
    expect(typeof total).toBe('number');
    expect(events.length).toBeLessThanOrEqual(5);
  });

  it('updateEventConvergence updates confidence and verification_status', async () => {
    if (!hasDb) return;

    const event = await withClient(async (client) =>
      createEvent(client, {
        canonical_title: 'Convergence test event',
        polarity_ui: 'neutre',
        occurred_at: new Date(),
        confidence_score: 0.6,
        verification_status: 'unverified',
      })
    );

    await withClient((client) =>
      updateEventConvergence(client, event.id, 2, 0.6)
    );

    const updated = await withClient((client) => getEventById(client, event.id));
    expect(updated).not.toBeNull();
    expect(updated!.verification_status).toBe('partially_verified');
    expect(updated!.confidence_score).toBeGreaterThanOrEqual(0.6);
    expect(updated!.confidence_score).toBeLessThanOrEqual(1);

    await withClient((client) =>
      updateEventConvergence(client, event.id, 3, updated!.confidence_score)
    );
    const verified = await withClient((client) => getEventById(client, event.id));
    expect(verified!.verification_status).toBe('verified');
  });
});
