/**
 * Connector registry tests.
 */

import { describe, it, expect } from 'vitest';
import {
  CONNECTORS,
  EVENT_SOURCE_NAMES,
  INDICATOR_SOURCE_NAMES,
} from '../connector-registry';
import { createConnector } from '../connector-factory';

describe('connector-registry', () => {
  it('has all expected connectors', () => {
    const names = CONNECTORS.map((c) => c.name);
    expect(names).toContain('gdelt');
    expect(names).toContain('usgs');
    expect(names).toContain('firms');
    expect(names).toContain('rss');
    expect(names).toContain('gdacs');
    expect(names).toContain('reliefweb');
    expect(names).toContain('weather');
    expect(names).toContain('cloudflare');
    expect(names).toContain('lbp-rate');
    expect(names).toContain('openaq');
    expect(names).toContain('twitter');
    expect(names.length).toBeGreaterThanOrEqual(11);
  });

  it('each connector has required meta', () => {
    for (const c of CONNECTORS) {
      expect(c.name).toBeDefined();
      expect(typeof c.getTTL()).toBe('number');
      expect(c.getTTL()).toBeGreaterThan(0);
      expect(['news', 'humanitarian', 'geophysical', 'economy', 'connectivity', 'social', 'indicators', 'conflict']).toContain(c.category);
      expect(typeof c.eventSource).toBe('boolean');
      expect(typeof c.indicatorSource).toBe('boolean');
    }
  });

  it('EVENT_SOURCE_NAMES matches eventSource connectors', () => {
    const eventConnectors = CONNECTORS.filter((c) => c.eventSource).map((c) => c.name);
    for (const name of eventConnectors) {
      expect(EVENT_SOURCE_NAMES.has(name)).toBe(true);
    }
  });

  it('INDICATOR_SOURCE_NAMES matches indicatorSource connectors', () => {
    const indicatorConnectors = CONNECTORS.filter((c) => c.indicatorSource).map((c) => c.name);
    for (const name of indicatorConnectors) {
      expect(INDICATOR_SOURCE_NAMES.has(name)).toBe(true);
    }
  });
});

describe('createConnector', () => {
  it('creates descriptor with wrapped normalize', () => {
    const connector = createConnector({
      name: 'test',
      category: 'news',
      eventSource: true,
      indicatorSource: false,
      ttlSeconds: 60,
      reliability: 'high',
      costClass: 'free',
      fetch: async () => ({ ok: true, data: { items: [] } }),
      normalize: (raw: { items: unknown[] }, fetchedAt) => [
        {
          id: 'test-1',
          source: 'rss',
          title: 'Test',
          timestamp: fetchedAt,
          latitude: 0,
          longitude: 0,
          classification: 'neutre',
          confidence: 0.5,
          category: 'neutral',
          severity: 'low',
          metadata: { fetchedAt, ttlSeconds: 60, sourceReliability: 'high' },
        },
      ],
    });

    expect(connector.name).toBe('test');
    expect(connector.getTTL()).toBe(60);
    expect(connector.normalize({ items: [] }, new Date())).toHaveLength(1);
  });
});
