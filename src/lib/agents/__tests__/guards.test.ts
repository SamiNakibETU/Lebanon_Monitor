import { describe, it, expect } from 'vitest';
import {
  hasRequiredCitations,
  truncateContent,
  shouldIncludeUncertainty,
  capCitations,
} from '../guards';

describe('guards', () => {
  it('truncateContent shortens long text', () => {
    const long = 'a'.repeat(5000);
    expect(truncateContent(long, 100).length).toBe(100);
    expect(truncateContent('short', 100)).toBe('short');
  });

  it('shouldIncludeUncertainty when citations empty or truncated', () => {
    expect(shouldIncludeUncertainty([], false, false)).toBe(true);
    expect(shouldIncludeUncertainty(['[event:x]'], true, false)).toBe(true);
    expect(shouldIncludeUncertainty(['[event:x]'], false, false)).toBe(false);
  });

  it('capCitations limits and dedupes', () => {
    const citations = ['[event:a]', '[event:b]', '[event:a]'];
    expect(capCitations(citations, 2)).toHaveLength(2);
  });
});
