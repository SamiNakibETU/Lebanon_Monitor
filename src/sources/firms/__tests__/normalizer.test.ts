import { describe, it, expect } from 'vitest';
import { normalize } from '../normalizer';
import { parseCsv } from '../parser';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('firms normalizer', () => {
  const csv = readFileSync(join(__dirname, 'fixtures', 'firms-response.csv'), 'utf-8');
  const rows = parseCsv(csv);

  it('should normalize FIRMS rows to LebanonEvent[]', () => {
    const fetchedAt = new Date();
    const events = normalize(rows, fetchedAt);

    expect(events).toHaveLength(2);

    events.forEach((event) => {
      expect(event.source).toBe('firms');
      expect(event.classification).toBe('ombre');
      expect(event.latitude).toBeGreaterThanOrEqual(33);
      expect(event.latitude).toBeLessThanOrEqual(35);
    });
  });

  it('should map FRP to severity', () => {
    const fetchedAt = new Date();
    const events = normalize(rows, fetchedAt);

    const low = events.find((e) => e.title.includes('5.2'));
    expect(low?.severity).toBe('low');

    const high = events.find((e) => e.title.includes('55.0'));
    expect(high?.severity).toBe('high');
  });
});
