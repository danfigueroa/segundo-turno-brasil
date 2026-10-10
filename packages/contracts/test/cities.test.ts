import { describe, expect, it } from 'vitest';
import { citiesResponseSchema } from '../src';

const city = {
  ibge: '1200401',
  name: 'RIO BRANCO',
  electorate: 280000,
  turnout: 220000,
  votes: { '13': 60000, '22': 140000 },
  ballots: { valid: 200000, blank: 8000, null: 12000 },
  sections: { total: 700, counted: 700 },
  updatedAt: '2026-10-04T19:10:00-03:00',
};
const response = {
  round: 1,
  uf: 'AC',
  cities: [city],
  fetchedAt: '2026-10-05T15:00:00.000Z',
  stale: false,
};

describe('citiesResponseSchema', () => {
  it('accepts the municipalities of a state', () => {
    expect(citiesResponseSchema.parse(response)).toEqual(response);
  });

  it('rejects unknown states, malformed IBGE codes and negative votes', () => {
    const invalid = [
      { ...response, uf: 'XX' },
      { ...response, cities: [{ ...city, ibge: '01120' }] },
      { ...response, cities: [{ ...city, votes: { '13': -1 } }] },
    ];
    for (const value of invalid) expect(citiesResponseSchema.safeParse(value).success).toBe(false);
  });
});
