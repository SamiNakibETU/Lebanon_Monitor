/**
 * resolvePlace unit tests.
 */

import { describe, it, expect } from 'vitest';
import { resolvePlace, resolvePlaceFromCandidates } from '../resolve-place';

describe('resolvePlace', () => {
  it('resolves English city names', () => {
    const r = resolvePlace('Beirut');
    expect(r).not.toBeNull();
    expect(r!.lat).toBeCloseTo(33.8938, 2);
    expect(r!.lng).toBeCloseTo(35.5018, 2);
    expect(r!.placeType).toBe('city');
    expect(r!.geoPrecision).toBe('city');
  });

  it('resolves French city names', () => {
    const r = resolvePlace('Beyrouth');
    expect(r).not.toBeNull();
    expect(r!.lat).toBeCloseTo(33.8938, 2);
    expect(r!.namePrimary).toBe('Beirut');
  });

  it('resolves Arabic city names', () => {
    const r = resolvePlace('بيروت');
    expect(r).not.toBeNull();
    expect(r!.lat).toBeCloseTo(33.8938, 2);
    expect(r!.nameAr).toBe('بيروت');
  });

  it('resolves governorates', () => {
    const r = resolvePlace('South Lebanon');
    expect(r).not.toBeNull();
    expect(r!.placeType).toBe('governorate');
    expect(r!.geoPrecision).toBe('governorate');
  });

  it('resolves neighborhood', () => {
    const r = resolvePlace('Dahieh');
    expect(r).not.toBeNull();
    expect(r!.placeType).toBe('neighborhood');
    expect(r!.geoPrecision).toBe('neighborhood');
  });

  it('returns null for unknown place', () => {
    expect(resolvePlace('Tokyo')).toBeNull();
    expect(resolvePlace('')).toBeNull();
    expect(resolvePlace('   ')).toBeNull();
  });

  it('is case-insensitive for Latin script', () => {
    expect(resolvePlace('TRIPOLI')).not.toBeNull();
    expect(resolvePlace('tyre')).not.toBeNull();
  });
});

describe('resolvePlaceFromCandidates', () => {
  it('returns first match', () => {
    const r = resolvePlaceFromCandidates(['Unknown', 'Beirut', 'Tyre']);
    expect(r).not.toBeNull();
    expect(r!.namePrimary).toBe('Beirut');
  });

  it('returns null when no candidate matches', () => {
    expect(resolvePlaceFromCandidates(['Tokyo', 'Paris'])).toBeNull();
    expect(resolvePlaceFromCandidates([])).toBeNull();
  });
});
