import { describe, expect, it } from 'vitest';
import {
  chooseEpisodeForEvent,
  getPlaceKey,
  type EventForLinking,
  type EpisodeCandidate,
} from '../episodes/choose-episode-for-event';

describe('episode linking', () => {
  it('attaches an event to an open episode when type, place, and time are aligned', () => {
    const event: EventForLinking = {
      id: 'ev-1',
      eventType: 'armed_conflict',
      occurredAt: new Date('2026-03-12T12:00:00Z'),
      metadata: { resolvedPlaceName: 'Tyre' },
    };
    const candidates: EpisodeCandidate[] = [
      {
        id: 'ep-1',
        eventType: 'armed_conflict',
        placeKey: 'Tyre',
        lastEventAt: new Date('2026-03-11T10:00:00Z'),
      },
    ];
    const result = chooseEpisodeForEvent(event, candidates);
    expect(result?.id).toBe('ep-1');
  });

  it('returns null when event type differs', () => {
    const event: EventForLinking = {
      id: 'ev-1',
      eventType: 'armed_conflict',
      occurredAt: new Date('2026-03-12T12:00:00Z'),
      metadata: { resolvedPlaceName: 'Tyre' },
    };
    const candidates: EpisodeCandidate[] = [
      {
        id: 'ep-1',
        eventType: 'political_tension',
        placeKey: 'Tyre',
        lastEventAt: new Date('2026-03-11T10:00:00Z'),
      },
    ];
    const result = chooseEpisodeForEvent(event, candidates);
    expect(result).toBeNull();
  });

  it('returns null when place differs', () => {
    const event: EventForLinking = {
      id: 'ev-1',
      eventType: 'armed_conflict',
      occurredAt: new Date('2026-03-12T12:00:00Z'),
      metadata: { resolvedPlaceName: 'Beirut' },
    };
    const candidates: EpisodeCandidate[] = [
      {
        id: 'ep-1',
        eventType: 'armed_conflict',
        placeKey: 'Tyre',
        lastEventAt: new Date('2026-03-11T10:00:00Z'),
      },
    ];
    const result = chooseEpisodeForEvent(event, candidates);
    expect(result).toBeNull();
  });

  it('returns null when event is more than 7 days after last event', () => {
    const event: EventForLinking = {
      id: 'ev-1',
      eventType: 'armed_conflict',
      occurredAt: new Date('2026-03-20T12:00:00Z'),
      metadata: { resolvedPlaceName: 'Tyre' },
    };
    const candidates: EpisodeCandidate[] = [
      {
        id: 'ep-1',
        eventType: 'armed_conflict',
        placeKey: 'Tyre',
        lastEventAt: new Date('2026-03-11T10:00:00Z'),
      },
    ];
    const result = chooseEpisodeForEvent(event, candidates);
    expect(result).toBeNull();
  });

  it('getPlaceKey uses resolvedPlaceName when present', () => {
    const event: EventForLinking = {
      id: 'ev-1',
      eventType: 'armed_conflict',
      occurredAt: new Date(),
      metadata: { resolvedPlaceName: 'Tripoli' },
    };
    expect(getPlaceKey(event)).toBe('Tripoli');
  });

  it('getPlaceKey uses lat,lng when no place name', () => {
    const event: EventForLinking = {
      id: 'ev-1',
      eventType: 'armed_conflict',
      occurredAt: new Date(),
      metadata: { latitude: 33.87, longitude: 35.51 },
    };
    expect(getPlaceKey(event)).toBe('33.87,35.51');
  });

  it('getPlaceKey returns unknown when no geo', () => {
    const event: EventForLinking = {
      id: 'ev-1',
      eventType: 'armed_conflict',
      occurredAt: new Date(),
    };
    expect(getPlaceKey(event)).toBe('unknown');
  });
});
