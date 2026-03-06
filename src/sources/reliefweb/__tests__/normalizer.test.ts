import { describe, it, expect } from 'vitest';
import { normalize } from '../normalizer';
import reliefwebFixture from './fixtures/reliefweb-response.json';

describe('reliefweb normalizer', () => {
  it('should normalize ReliefWeb reports to LebanonEvent[]', () => {
    const fetchedAt = new Date();
    const events = normalize(reliefwebFixture.data, fetchedAt);

    expect(events).toHaveLength(2);

    events.forEach((event) => {
      expect(event.source).toBe('reliefweb');
      expect(['lumiere', 'ombre', 'neutre']).toContain(event.classification);
    });
  });
});
