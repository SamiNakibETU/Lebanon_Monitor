import { describe, it, expect } from 'vitest';
import { normalize } from '../normalizer';
import cloudflareFixture from './fixtures/cloudflare-response.json';

describe('cloudflare normalizer', () => {
  it('should normalize outages to LebanonEvent[]', () => {
    const fetchedAt = new Date();
    const events = normalize(cloudflareFixture, fetchedAt);

    expect(events).toHaveLength(1);
    expect(events[0].source).toBe('cloudflare');
    expect(events[0].classification).toBe('ombre');
    expect(events[0].severity).toBe('high');
  });
});
