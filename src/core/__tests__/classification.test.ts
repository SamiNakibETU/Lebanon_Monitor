/**
 * Tests for main classification pipeline.
 */

import { describe, it, expect } from 'vitest';
import { classify } from '../classification';
import ombreTitles from './fixtures/ombre-titles.json';
import lumiereTitles from './fixtures/lumiere-titles.json';

describe('classify', () => {
  describe('golden cases from plan', () => {
    it('classifies "Israeli airstrikes target Baalbek" as ombre', () => {
      const r = classify('Israeli airstrikes target Baalbek');
      expect(r.classification).toBe('ombre');
      expect(r.confidence).toBeGreaterThan(0.5);
    });

    it('classifies "Inauguration d\'un centre culturel à Beyrouth" as lumiere', () => {
      const r = classify("Inauguration d'un centre culturel à Beyrouth");
      expect(r.classification).toBe('lumiere');
      expect(r.confidence).toBeGreaterThan(0.5);
    });

    it('classifies Arabic ombre headline as ombre', () => {
      const r = classify('قصف إسرائيلي يستهدف الضاحية الجنوبية');
      expect(r.classification).toBe('ombre');
      expect(r.confidence).toBeGreaterThan(0.5);
    });

    it('classifies Arabic lumiere headline as lumiere', () => {
      const r = classify('افتتاح مهرجان بيروت الدولي');
      expect(r.classification).toBe('lumiere');
      expect(r.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('fixture: ombre titles', () => {
    (ombreTitles as string[]).forEach((title, i) => {
      it(`ombre fixture ${i + 1}: "${title.slice(0, 40)}..."`, () => {
        const r = classify(title);
        expect(r.classification).toBe('ombre');
      });
    });
  });

  describe('fixture: lumiere titles', () => {
    (lumiereTitles as string[]).forEach((title, i) => {
      it(`lumiere fixture ${i + 1}: "${title.slice(0, 40)}..."`, () => {
        const r = classify(title);
        expect(r.classification).toBe('lumiere');
      });
    });
  });

  describe('tone option', () => {
    it('uses positive tone to push toward lumiere', () => {
      const r = classify('Beirut update', { tone: 8 });
      expect(r.classification).toBe('lumiere');
    });

    it('uses negative tone to push toward ombre', () => {
      const r = classify('Beirut update', { tone: -8 });
      expect(r.classification).toBe('ombre');
    });

    it('neutral tone keeps neutre for ambiguous text', () => {
      const r = classify('Weather today', { tone: 0 });
      expect(r.classification).toBe('neutre');
    });
  });

  describe('hfResult option', () => {
    it('uses negative HF result for ombre', () => {
      const r = classify('News from Lebanon', { hfResult: { label: 'negative', score: 0.9 } });
      expect(r.classification).toBe('ombre');
    });

    it('uses positive HF result for lumiere', () => {
      const r = classify('News from Lebanon', { hfResult: { label: 'positive', score: 0.9 } });
      expect(r.classification).toBe('lumiere');
    });
  });

  describe('neutral cases', () => {
    it('classifies indicator-like text as neutre when no keywords match', () => {
      const r = classify('Meeting scheduled for Tuesday noon');
      expect(r.classification).toBe('neutre');
    });

    it('classifies generic text as neutre when no keywords match', () => {
      const r = classify('Traffic update pending');
      expect(r.classification).toBe('neutre');
    });
  });

  describe('result shape', () => {
    it('returns valid ClassificationResult', () => {
      const r = classify('Israeli airstrikes hit south Lebanon');
      expect(r).toHaveProperty('classification');
      expect(r).toHaveProperty('confidence');
      expect(r).toHaveProperty('category');
      expect(r).toHaveProperty('method');
      expect(['lumiere', 'ombre', 'neutre']).toContain(r.classification);
      expect(r.confidence).toBeGreaterThanOrEqual(0);
      expect(r.confidence).toBeLessThanOrEqual(1);
    });
  });
});
