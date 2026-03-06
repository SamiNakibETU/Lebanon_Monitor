import { describe, it, expect } from 'vitest';
import { normalize } from '../normalizer';
import openaqFixture from './fixtures/openaq-response.json';

describe('openaq normalizer', () => {
  it('should normalize OpenAQ results to LebanonEvent[]', () => {
    const fetchedAt = new Date();
    const events = normalize(openaqFixture.results, fetchedAt);

    expect(events).toHaveLength(2);

    events.forEach((event) => {
      expect(event.source).toBe('openaq');
    });
  });

  it('should classify PM2.5 > 35 as ombre', () => {
    const fetchedAt = new Date();
    const events = normalize(openaqFixture.results, fetchedAt);
    const beirut = events.find((e) => e.title.includes('Beirut'));
    expect(beirut?.classification).toBe('ombre');
  });

  it('should classify PM2.5 <= 12 as lumiere', () => {
    const fetchedAt = new Date();
    const events = normalize(openaqFixture.results, fetchedAt);
    const tripoli = events.find((e) => e.title.includes('Tripoli'));
    expect(tripoli?.classification).toBe('lumiere');
  });
});
