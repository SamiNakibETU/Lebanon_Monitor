import { describe, it, expect } from 'vitest';
import { normalize } from '../normalizer';
import weatherFixture from './fixtures/weather-response.json';

describe('weather normalizer', () => {
  it('should normalize weather data to LebanonEvent[]', () => {
    const fetchedAt = new Date();
    const events = normalize(weatherFixture, fetchedAt);

    expect(events).toHaveLength(2);

    events.forEach((event) => {
      expect(event.source).toBe('weather');
    });
  });

  it('should classify extreme weather as ombre', () => {
    const fetchedAt = new Date();
    const events = normalize(weatherFixture, fetchedAt);
    const extreme = events.find((e) => e.title.includes('42'));
    expect(extreme?.classification).toBe('ombre');
  });
});
