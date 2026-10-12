import { afterEach, describe, expect, it, vi } from 'vitest';
import { isPinnable, myPlaceNoun, myPlaceOf, readMyPlace, writeMyPlace } from './my-place';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('my place', () => {
  it('stores and reads back the pinned place', () => {
    writeMyPlace(myPlaceOf({ kind: 'city', state: 'BA', ibge: '2927408' }, 'Salvador'));
    expect(readMyPlace()).toEqual({ path: 'ba/2927408', label: 'Salvador' });
    writeMyPlace(undefined);
    expect(readMyPlace()).toBeUndefined();
  });

  it('ignores anything else in storage', () => {
    localStorage.setItem('stb:my-place', '{"path":1}');
    expect(readMyPlace()).toBeUndefined();
    localStorage.setItem('stb:my-place', 'not json');
    expect(readMyPlace()).toBeUndefined();
  });

  it('works without storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    expect(() => writeMyPlace({ path: 'ba', label: 'Bahia' })).not.toThrow();
    expect(readMyPlace()).toBeUndefined();
  });

  it('pins states, cities and countries abroad, each with its noun', () => {
    expect(isPinnable({ kind: 'country' })).toBe(false);
    expect(isPinnable({ kind: 'region', code: 'NE' })).toBe(false);
    expect(myPlaceNoun({ kind: 'state', code: 'BA' })).toBe('meu estado');
    expect(myPlaceNoun({ kind: 'city', state: 'BA', ibge: '2927408' })).toBe('minha cidade');
    expect(myPlaceNoun({ kind: 'abroadCountry', slug: 'portugal' })).toBe('meu país');
  });
});
