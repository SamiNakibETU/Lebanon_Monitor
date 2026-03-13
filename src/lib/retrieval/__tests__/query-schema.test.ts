import { describe, it, expect } from 'vitest';
import { retrievalQuerySchema } from '../query-schema';

describe('retrievalQuerySchema', () => {
  it('parses valid query with defaults', () => {
    const result = retrievalQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.objectTypes).toEqual(['events']);
      expect(result.data.limit).toBe(30);
      expect(result.data.offset).toBe(0);
    }
  });

  it('accepts q and objectTypes', () => {
    const result = retrievalQuerySchema.safeParse({
      q: 'beirut',
      objectTypes: ['events', 'places'],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.q).toBe('beirut');
      expect(result.data.objectTypes).toEqual(['events', 'places']);
    }
  });

  it('accepts placeId for place-scoped retrieval', () => {
    const placeId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const result = retrievalQuerySchema.safeParse({ placeId });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.placeId).toBe(placeId);
    }
  });

  it('accepts fromDate and toDate for temporal filter', () => {
    const result = retrievalQuerySchema.safeParse({
      fromDate: '2026-01-01',
      toDate: '2026-03-12',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fromDate).toBe('2026-01-01');
      expect(result.data.toDate).toBe('2026-03-12');
    }
  });

  it('accepts limit and offset for pagination', () => {
    const result = retrievalQuerySchema.safeParse({
      limit: 50,
      offset: 25,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
      expect(result.data.offset).toBe(25);
    }
  });
});
