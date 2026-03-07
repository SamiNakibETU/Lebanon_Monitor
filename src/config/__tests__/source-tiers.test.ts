/**
 * Source tiers tests — pure unit tests, no DB.
 */

import { describe, it, expect } from 'vitest';
import { getSourceTier } from '../source-tiers';

describe('source-tiers', () => {
  it('getSourceTier returns T2 for gdelt (medium reliability)', () => {
    expect(getSourceTier('gdelt')).toBe('T2');
  });

  it('getSourceTier returns T1 for acled (high reliability)', () => {
    expect(getSourceTier('acled')).toBe('T1');
  });

  it('getSourceTier returns T1 for reliefweb (high reliability)', () => {
    expect(getSourceTier('reliefweb')).toBe('T1');
  });

  it('getSourceTier returns T3 for twitter (low reliability)', () => {
    expect(getSourceTier('twitter')).toBe('T3');
  });

  it('getSourceTier returns null for null', () => {
    expect(getSourceTier(null)).toBeNull();
  });

  it('getSourceTier returns null for undefined', () => {
    expect(getSourceTier(undefined)).toBeNull();
  });

  it('getSourceTier returns null for unknown source', () => {
    expect(getSourceTier('unknown-source-xyz')).toBeNull();
  });

  it('getSourceTier is case-insensitive', () => {
    expect(getSourceTier('GDELT')).toBe('T2');
    expect(getSourceTier('ACLED')).toBe('T1');
  });
});
