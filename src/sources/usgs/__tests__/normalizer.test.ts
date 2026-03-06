import { describe, it, expect } from 'vitest';
import { normalize } from '../normalizer';
import usgsFixture from './fixtures/usgs-response.json';
import type { UsgsFeature } from '../types';

describe('usgs normalizer', () => {
  it('should normalize GeoJSON features to LebanonEvent[]', () => {
    const fetchedAt = new Date();
    const events = normalize(usgsFixture.features as UsgsFeature[], fetchedAt);

    expect(events).toHaveLength(2);

    events.forEach((event) => {
      expect(event.source).toBe('usgs');
      expect(event.classification).toBe('ombre');
      expect(event.latitude).toBeGreaterThanOrEqual(33);
      expect(event.latitude).toBeLessThanOrEqual(35);
      expect(event.longitude).toBeGreaterThanOrEqual(35);
      expect(event.longitude).toBeLessThanOrEqual(37);
    });
  });

  it('should map magnitude to severity', () => {
    const fetchedAt = new Date();
    const events = normalize(usgsFixture.features as UsgsFeature[], fetchedAt);

    const m32 = events.find((e) => e.title.includes('3.2'));
    expect(m32?.severity).toBe('medium');

    const m51 = events.find((e) => e.title.includes('5.1'));
    expect(m51?.severity).toBe('high');
  });
});
