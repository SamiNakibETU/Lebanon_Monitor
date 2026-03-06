import { describe, it, expect } from 'vitest';
import { normalize } from '../normalizer';
import rssFixture from './fixtures/rss-items.json';

describe('rss normalizer', () => {
  it('should normalize RSS items to LebanonEvent[]', () => {
    const fetchedAt = new Date();
    const events = normalize(rssFixture.items, fetchedAt);

    expect(events).toHaveLength(2);

    events.forEach((event) => {
      expect(event.source).toBe('rss');
      expect(['lumiere', 'ombre', 'neutre']).toContain(event.classification);
    });
  });

  it('should extract city coords from title', () => {
    const fetchedAt = new Date();
    const events = normalize(rssFixture.items, fetchedAt);

    const beirut = events.find((e) => e.title.includes('Beirut'));
    expect(beirut?.latitude).toBeCloseTo(33.89, 1);

    const tripoli = events.find((e) => e.title.includes('crisis'));
    expect(tripoli?.latitude).toBeCloseTo(34.43, 1); // Tripoli from contentSnippet
  });
});
