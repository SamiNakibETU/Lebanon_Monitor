/**
 * Tests for pre-classifier hard overrides.
 */

import { describe, it, expect } from 'vitest';
import { preClassify } from '../classification/pre-classifier';

describe('preClassify', () => {
  describe('HARD_OMBRE', () => {
    it('returns ombre for "airstrike"', () => {
      const r = preClassify('Israeli airstrike on Baalbek');
      expect(r).not.toBeNull();
      expect(r!.classification).toBe('ombre');
      expect(r!.category).toBe('armed_conflict');
      expect(r!.method).toBe('pre-classifier');
    });

    it('returns ombre for "killed"', () => {
      const r = preClassify('Five people killed in explosion');
      expect(r?.classification).toBe('ombre');
    });

    it('returns ombre for "قصف"', () => {
      const r = preClassify('قصف إسرائيلي على بعلبك');
      expect(r?.classification).toBe('ombre');
    });

    it('returns ombre for "frappe"', () => {
      const r = preClassify('Frappes israéliennes sur le Liban');
      expect(r?.classification).toBe('ombre');
    });

    it('returns ombre for "shelling"', () => {
      const r = preClassify('Shelling continues in south Lebanon');
      expect(r?.classification).toBe('ombre');
    });
  });

  describe('HARD_LUMIERE', () => {
    it('returns lumiere for "inauguration"', () => {
      const r = preClassify('Inauguration of new cultural center');
      expect(r?.classification).toBe('lumiere');
      expect(r?.category).toBe('institutional_progress');
    });

    it('returns lumiere for "festival"', () => {
      const r = preClassify('Beirut Festival opens tonight');
      expect(r?.classification).toBe('lumiere');
    });

    it('returns lumiere for "افتتاح"', () => {
      const r = preClassify('افتتاح معرض الفنون');
      expect(r?.classification).toBe('lumiere');
    });

    it('returns lumiere for "reconstruction"', () => {
      const r = preClassify('Reconstruction project in Tripoli');
      expect(r?.classification).toBe('lumiere');
    });
  });

  describe('NEGATION check (V2)', () => {
    it('returns null when lumière keyword + negation (defer to LLM)', () => {
      const r = preClassify('Macron tente un cessez-le-feu mais se heurte au refus');
      expect(r).toBeNull();
    });

    it('returns ombre when hard ombre overrides lumière', () => {
      const r = preClassify('Cessez-le-feu violé : tirs dans le Sud');
      expect(r?.classification).toBe('ombre');
    });
  });

  describe('no match', () => {
    it('returns null for neutral text', () => {
      const r = preClassify('Weather in Beirut: 15°C');
      expect(r).toBeNull();
    });

    it('returns null for ambiguous text', () => {
      const r = preClassify('Lebanon news update');
      expect(r).toBeNull();
    });
  });
});
