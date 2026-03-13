import { describe, it, expect } from 'vitest';
import { formatCitation, parseCitation } from '../citations';

describe('citations', () => {
  it('formatCitation produces [type:id] format', () => {
    expect(formatCitation('event', 'abc-123')).toBe('[event:abc-123]');
    expect(formatCitation('episode', 'def-456')).toBe('[episode:def-456]');
    expect(formatCitation('place', 'ghi-789')).toBe('[place:ghi-789]');
  });

  it('parseCitation extracts type and id', () => {
    expect(parseCitation('[event:abc-123]')).toEqual({ type: 'event', id: 'abc-123' });
    expect(parseCitation('[claim:x-y-z]')).toEqual({ type: 'claim', id: 'x-y-z' });
    expect(parseCitation('invalid')).toBeNull();
  });
});
