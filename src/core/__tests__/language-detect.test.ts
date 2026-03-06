/**
 * Tests for language detection.
 */

import { describe, it, expect } from 'vitest';
import { detectLanguage } from '../language/detect';

describe('detectLanguage', () => {
  describe('Arabic', () => {
    it('detects Arabic when 2+ Arabic chars present', () => {
      expect(detectLanguage('قصف إسرائيلي')).toBe('ar');
      expect(detectLanguage('افتتاح مهرجان')).toBe('ar');
    });
  });

  describe('French', () => {
    it('detects French with common markers', () => {
      expect(detectLanguage('Le gouvernement du Liban')).toBe('fr');
      expect(detectLanguage('Inauguration à Beyrouth')).toBe('fr');
    });
  });

  describe('English', () => {
    it('detects English by default', () => {
      expect(detectLanguage('Israeli airstrikes target Beirut')).toBe('en');
    });

    it('returns en for empty string (default)', () => {
      expect(detectLanguage('')).toBe('en');
    });
  });
});
