import { describe, expect, it } from 'vitest';
import { aggregateCountries, type AbroadCityResult } from '../src';

function city(name: string, country: string, votes: Record<string, number>): AbroadCityResult {
  return {
    code: name,
    name,
    country,
    continent: 'AM',
    lat: 0,
    lon: 0,
    electorate: 100,
    votes,
    sections: { total: 2, counted: 1 },
  };
}

describe('aggregateCountries', () => {
  it('adds the votes and sections of the cities of each country', () => {
    const countries = aggregateCountries([
      city('BOSTON', 'Estados Unidos', { '13': 10, '22': 20 }),
      city('LISBOA', 'Portugal', { '13': 5 }),
      city('MIAMI', 'Estados Unidos', { '13': 1, '22': 30 }),
    ]);
    expect(countries).toEqual([
      {
        name: 'Estados Unidos',
        continent: 'AM',
        votes: { '13': 11, '22': 50 },
        sections: { total: 4, counted: 2 },
      },
      { name: 'Portugal', continent: 'AM', votes: { '13': 5 }, sections: { total: 2, counted: 1 } },
    ]);
  });
});
