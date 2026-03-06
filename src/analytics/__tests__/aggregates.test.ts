/**
 * Event aggregates unit tests.
 */

import { describe, it, expect } from 'vitest';
import { computeEventAggregates } from '../aggregates';
import type { LebanonEvent } from '@/types/events';

function mkEvent(
  overrides: Partial<LebanonEvent> & { classification: LebanonEvent['classification']; category: LebanonEvent['category'] }
): LebanonEvent {
  return {
    id: 'test-1',
    source: 'rss',
    title: 'Test',
    timestamp: new Date('2025-03-06T12:00:00Z'),
    latitude: 33.89,
    longitude: 35.5,
    confidence: 0.8,
    severity: 'low',
    metadata: { fetchedAt: new Date(), ttlSeconds: 3600, sourceReliability: 'medium' },
    ...overrides,
  } as LebanonEvent;
}

describe('computeEventAggregates', () => {
  it('aggregates by polarity', () => {
    const events = [
      mkEvent({ classification: 'lumiere', category: 'cultural_event' }),
      mkEvent({ classification: 'lumiere', category: 'cultural_event' }),
      mkEvent({ classification: 'ombre', category: 'armed_conflict' }),
      mkEvent({ classification: 'neutre', category: 'neutral' }),
    ];
    const agg = computeEventAggregates(events);
    expect(agg.byPolarity).toEqual({ lumiere: 2, ombre: 1, neutre: 1 });
    expect(agg.total).toBe(4);
  });

  it('aggregates by category', () => {
    const events = [
      mkEvent({ classification: 'lumiere', category: 'cultural_event' }),
      mkEvent({ classification: 'ombre', category: 'cultural_event' }),
      mkEvent({ classification: 'ombre', category: 'armed_conflict' }),
    ];
    const agg = computeEventAggregates(events);
    expect(agg.byCategory['cultural_event']).toBe(2);
    expect(agg.byCategory['armed_conflict']).toBe(1);
  });

  it('aggregates by day', () => {
    const events = [
      mkEvent({
        classification: 'lumiere',
        category: 'neutral',
        timestamp: new Date('2025-03-06T10:00:00Z'),
      }),
      mkEvent({
        classification: 'ombre',
        category: 'neutral',
        timestamp: new Date('2025-03-06T14:00:00Z'),
      }),
      mkEvent({
        classification: 'neutre',
        category: 'neutral',
        timestamp: new Date('2025-03-05T12:00:00Z'),
      }),
    ];
    const agg = computeEventAggregates(events);
    expect(agg.byDay).toHaveLength(2);
    const day6 = agg.byDay.find((d) => d.date === '2025-03-06');
    const day5 = agg.byDay.find((d) => d.date === '2025-03-05');
    expect(day6).toEqual({ date: '2025-03-06', count: 2, lumiere: 1, ombre: 1, neutre: 0 });
    expect(day5).toEqual({ date: '2025-03-05', count: 1, lumiere: 0, ombre: 0, neutre: 1 });
  });

  it('returns empty aggregates for no events', () => {
    const agg = computeEventAggregates([]);
    expect(agg.byPolarity).toEqual({ lumiere: 0, ombre: 0, neutre: 0 });
    expect(agg.byCategory).toEqual({});
    expect(agg.byDay).toEqual([]);
    expect(agg.total).toBe(0);
  });
});
