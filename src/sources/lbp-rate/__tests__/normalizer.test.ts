import { describe, it, expect } from 'vitest';
import { normalize } from '../normalizer';

describe('lbp-rate normalizer', () => {
  it('should normalize rate to LebanonEvent', () => {
    const fetchedAt = new Date();
    const events = normalize(89500, fetchedAt);

    expect(events).toHaveLength(1);
    expect(events[0].source).toBe('lbp-rate');
    expect(events[0].classification).toBe('neutre');
  });

  it('should classify rate increase as ombre', () => {
    const fetchedAt = new Date();
    const events = normalize(90000, fetchedAt, 85000);
    expect(events[0].classification).toBe('ombre');
  });

  it('should classify rate decrease as lumiere', () => {
    const fetchedAt = new Date();
    const events = normalize(85000, fetchedAt, 90000);
    expect(events[0].classification).toBe('lumiere');
  });
});
