import { describe, expect, it } from 'vitest';
import { aggregateCountries, countryTally, type AbroadCityResult, type Tally } from '../src';

function city(
  name: string,
  country: string,
  votes: Record<string, number>,
  updatedAt = '2026-10-25T20:00:00-03:00',
): AbroadCityResult {
  const valid = Object.values(votes).reduce((sum, v) => sum + v, 0);
  return {
    code: name,
    name,
    country,
    continent: 'AM',
    lat: 0,
    lon: 0,
    electorate: 100,
    turnout: valid + 3,
    votes,
    ballots: { valid, blank: 1, null: 2 },
    sections: { total: 2, counted: 1 },
    updatedAt,
  };
}

describe('aggregateCountries', () => {
  it('adds up the votes, ballots, voters and sections of the cities of each country', () => {
    const countries = aggregateCountries([
      city('BOSTON', 'Estados Unidos', { '13': 10, '22': 20 }, '2026-10-25T20:10:00-03:00'),
      city('LISBOA', 'Portugal', { '13': 5 }),
      city('MIAMI', 'Estados Unidos', { '13': 1, '22': 30 }, '2026-10-25T20:05:00-03:00'),
    ]);
    expect(countries).toEqual([
      {
        name: 'Estados Unidos',
        continent: 'AM',
        votes: { '13': 11, '22': 50 },
        sections: { total: 4, counted: 2 },
        electorate: 200,
        turnout: 67,
        ballots: { valid: 61, blank: 2, null: 4 },
        updatedAt: '2026-10-25T20:10:00-03:00',
      },
      {
        name: 'Portugal',
        continent: 'AM',
        votes: { '13': 5 },
        sections: { total: 2, counted: 1 },
        electorate: 100,
        turnout: 8,
        ballots: { valid: 5, blank: 1, null: 2 },
        updatedAt: '2026-10-25T20:00:00-03:00',
      },
    ]);
  });
});

describe('countryTally', () => {
  const abroad: Tally = {
    scope: { kind: 'abroad' },
    candidates: [
      { number: '22', name: 'FLÁVIO BOLSONARO', party: 'PL', votes: 90, share: 60 },
      { number: '13', name: 'LULA', party: 'PT', votes: 60, share: 40 },
    ],
    sections: { total: 10, counted: 10 },
    electorate: 1000,
    turnout: 160,
    votes: { valid: 150, blank: 4, null: 6 },
    updatedAt: '2026-10-25T21:00:00-03:00',
  };

  it('shows a country like any scope, with the names of the abroad tally', () => {
    const [portugal] = aggregateCountries([city('LISBOA', 'Portugal', { '13': 30, '22': 10 })]);
    if (!portugal) throw new Error('No country');
    expect(countryTally(portugal, abroad)).toEqual({
      scope: { kind: 'abroad' },
      candidates: [
        { number: '13', name: 'LULA', party: 'PT', votes: 30, share: 75 },
        { number: '22', name: 'FLÁVIO BOLSONARO', party: 'PL', votes: 10, share: 25 },
      ],
      sections: { total: 2, counted: 1 },
      electorate: 100,
      turnout: 43,
      votes: { valid: 40, blank: 1, null: 2 },
      updatedAt: '2026-10-25T20:00:00-03:00',
    });
  });
});
