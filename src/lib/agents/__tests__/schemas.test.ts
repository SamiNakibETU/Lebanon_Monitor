import { describe, it, expect } from 'vitest';
import {
  agentSynthesisRequestSchema,
  agentExploreRequestSchema,
  agentResponseSchema,
} from '../schemas';

describe('agent schemas', () => {
  describe('agentSynthesisRequestSchema', () => {
    it('accepts minimal query', () => {
      const result = agentSynthesisRequestSchema.safeParse({ query: 'What is the situation?' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contextHint).toBeUndefined();
      }
    });

    it('accepts query with contextHint', () => {
      const result = agentSynthesisRequestSchema.safeParse({
        query: 'Summarize vitality',
        contextHint: 'vitality',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contextHint).toBe('vitality');
      }
    });

    it('rejects empty query', () => {
      const result = agentSynthesisRequestSchema.safeParse({ query: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('agentExploreRequestSchema', () => {
    it('accepts query with focus and id', () => {
      const result = agentExploreRequestSchema.safeParse({
        query: 'Explore this place',
        focus: 'place',
        id: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid uuid for id', () => {
      const result = agentExploreRequestSchema.safeParse({
        query: 'Explore',
        focus: 'place',
        id: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('agentResponseSchema', () => {
    it('validates response with content and citations', () => {
      const result = agentResponseSchema.safeParse({
        content: 'Summary text',
        citations: ['[event:abc]'],
      });
      expect(result.success).toBe(true);
    });

    it('accepts optional uncertainty and truncated', () => {
      const result = agentResponseSchema.safeParse({
        content: 'Text',
        citations: [],
        uncertainty: 'Données partielles.',
        truncated: true,
      });
      expect(result.success).toBe(true);
    });
  });
});
