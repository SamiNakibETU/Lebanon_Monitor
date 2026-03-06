/**
 * Tests for deduplication module.
 */

import { describe, it, expect } from 'vitest';
import { deduplicateEvents, normalizeTitle, jaccardSimilarity } from '../deduplication';
import type { LebanonEvent } from '../types';

function makeEvent(
  id: string,
  source: string,
  title: string,
  timestamp: Date
): LebanonEvent {
  return {
    id,
    source: source as never,
    title,
    timestamp,
    latitude: 33.9,
    longitude: 35.5,
    classification: 'ombre',
    confidence: 0.8,
    category: 'political_tension',
    severity: 'medium',
    metadata: {
      fetchedAt: new Date(),
      ttlSeconds: 3600,
      sourceReliability: 'high',
    },
  };
}

describe('normalizeTitle', () => {
  it('lowercases and trims', () => {
    expect(normalizeTitle('  Israeli Airstrikes  ')).toBe('israeli airstrikes');
  });

  it('strips punctuation but keeps Arabic', () => {
    expect(normalizeTitle('Hello, World!')).toBe('hello world');
    expect(normalizeTitle('قصف بيروت')).toContain('قصف');
  });

  it('truncates to 80 chars', () => {
    const long = 'a'.repeat(100);
    expect(normalizeTitle(long).length).toBe(80);
  });
});

describe('jaccardSimilarity', () => {
  it('returns 1 for identical strings', () => {
    expect(jaccardSimilarity('hello world', 'hello world')).toBe(1);
  });

  it('returns 0 for disjoint strings', () => {
    expect(jaccardSimilarity('abc', 'xyz')).toBe(0);
  });

  it('returns >= 0.6 for similar titles', () => {
    const s = jaccardSimilarity(
      'Israeli airstrikes target Baalbek',
      'Israeli airstrikes hit Baalbek'
    );
    expect(s).toBeGreaterThanOrEqual(0.6);
  });
});

describe('deduplicateEvents', () => {
  it('reduces 5 identical tweets to 1', () => {
    const base = new Date('2025-01-15T12:00:00Z');
    const events: LebanonEvent[] = [];
    for (let i = 0; i < 5; i++) {
      events.push(
        makeEvent(`tw-${i}`, 'twitter', 'Israeli airstrikes target south Lebanon', base)
      );
    }
    const out = deduplicateEvents(events);
    expect(out).toHaveLength(1);
  });

  it('keeps higher-priority source when same title', () => {
    const base = new Date('2025-01-15T12:00:00Z');
    const events = [
      makeEvent('1', 'twitter', 'Airstrike hits Baalbek', base),
      makeEvent('2', 'gdelt', 'Airstrike hits Baalbek', base),
    ];
    const out = deduplicateEvents(events);
    expect(out).toHaveLength(1);
    expect(out[0].source).toBe('gdelt');
  });

  it('keeps different-day same-title events', () => {
    const events = [
      makeEvent('1', 'gdelt', 'Beirut explosion', new Date('2025-01-15')),
      makeEvent('2', 'gdelt', 'Beirut explosion', new Date('2025-01-16')),
    ];
    const out = deduplicateEvents(events);
    expect(out).toHaveLength(2);
  });

  it('merges similar (Jaccard >= 0.6) same-day events, keeping higher priority', () => {
    const base = new Date('2025-01-15T12:00:00Z');
    const events = [
      makeEvent('1', 'twitter', 'Israeli airstrikes on Baalbek', base),
      makeEvent('2', 'rss', 'Israeli airstrikes in Baalbek', base),
    ];
    const out = deduplicateEvents(events);
    expect(out).toHaveLength(1);
    expect(out[0].source).toBe('rss');
  });
});
