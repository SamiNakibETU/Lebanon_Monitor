import { describe, it, expect } from 'vitest';
import { normalize } from '../normalizer';
import gdacsFixture from './fixtures/gdacs-response.json';
import type { GdacsFeature } from '../types';

describe('gdacs normalizer', () => {
  it('should normalize GDACS features to LebanonEvent[]', () => {
    const fetchedAt = new Date();
    const events = normalize(gdacsFixture.features as GdacsFeature[], fetchedAt);

    expect(events).toHaveLength(1);
    expect(events[0].source).toBe('gdacs');
    expect(events[0].classification).toBe('ombre');
    expect(events[0].severity).toBe('high');
  });
});
