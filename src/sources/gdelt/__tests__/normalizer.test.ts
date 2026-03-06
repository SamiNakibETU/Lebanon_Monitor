import { describe, it, expect } from 'vitest';
import { normalize } from '../normalizer';
import gdeltFixture from './fixtures/gdelt-response.json';

describe('gdelt normalizer', () => {
  it('should normalize valid response to LebanonEvent[]', () => {
    const fetchedAt = new Date('2025-03-01T12:00:00Z');
    const events = normalize(gdeltFixture.articles, fetchedAt);

    expect(events).toHaveLength(3);

    events.forEach((event) => {
      expect(event.source).toBe('gdelt');
      expect(event.title).toBeTruthy();
      expect(event.latitude).toBeGreaterThanOrEqual(33);
      expect(event.latitude).toBeLessThanOrEqual(35);
      expect(event.longitude).toBeGreaterThanOrEqual(35);
      expect(event.longitude).toBeLessThanOrEqual(37);
      expect(['lumiere', 'ombre', 'neutre']).toContain(event.classification);
      expect(event.confidence).toBeGreaterThanOrEqual(0);
      expect(event.confidence).toBeLessThanOrEqual(1);
    });
  });

  it('should classify by tone: positive tone -> lumiere', () => {
    const fetchedAt = new Date();
    const events = normalize(gdeltFixture.articles, fetchedAt);
    const positive = events.find((e) => e.title.includes('budget reform'));
    expect(positive?.classification).toBe('lumiere');
  });

  it('should classify by tone: negative tone -> ombre', () => {
    const fetchedAt = new Date();
    const events = normalize(gdeltFixture.articles, fetchedAt);
    const negative = events.find((e) => e.title.includes('Economic crisis'));
    expect(negative?.classification).toBe('ombre');
  });

  it('should classify by tone: neutral tone -> neutre', () => {
    const fetchedAt = new Date();
    const events = normalize(gdeltFixture.articles, fetchedAt);
    const neutral = events.find((e) => e.title.includes('Weather report'));
    expect(neutral?.classification).toBe('neutre');
  });
});
