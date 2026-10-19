import { describe, expect, it } from 'vitest';
import { ABROAD_CITIES } from '../../../api/src/adapters/tse/abroad-cities';
import { COUNTRY_CODES } from './country-codes';

describe('COUNTRY_CODES', () => {
  it('has the code of every country with polling stations abroad', () => {
    const countries = new Set(Object.values(ABROAD_CITIES).map((city) => city.country));
    expect([...countries].filter((name) => !COUNTRY_CODES[name])).toEqual([]);
  });

  it('names each country in other languages', () => {
    const names = new Intl.DisplayNames('en', { type: 'region' });
    expect(names.of(COUNTRY_CODES['Holanda'] ?? '')).toBe('Netherlands');
    expect(names.of(COUNTRY_CODES['Estados Unidos'] ?? '')).toBe('United States');
  });
});
