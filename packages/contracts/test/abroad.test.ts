import { describe, expect, it } from 'vitest';
import { abroadResponseSchema } from '../src';

const response = {
  round: 1,
  countries: [
    {
      name: 'Portugal',
      continent: 'EU',
      votes: { '13': 26401, '22': 19412 },
      sections: { total: 120, counted: 120 },
    },
  ],
  cities: [
    {
      code: '30392',
      name: 'LISBOA',
      country: 'Portugal',
      continent: 'EU',
      lat: 38.7,
      lon: -9.1,
      electorate: 60000,
      votes: { '13': 15000, '22': 11000 },
      sections: { total: 70, counted: 70 },
    },
  ],
  fetchedAt: '2026-10-05T15:00:00.000Z',
  stale: false,
};

describe('abroadResponseSchema', () => {
  it('accepts a breakdown by country and city', () => {
    expect(abroadResponseSchema.parse(response)).toEqual(response);
  });

  it('rejects unknown continents and negative votes', () => {
    const [country] = response.countries;
    expect(
      abroadResponseSchema.safeParse({ ...response, countries: [{ ...country, continent: 'OC' }] })
        .success,
    ).toBe(false);
    expect(
      abroadResponseSchema.safeParse({
        ...response,
        countries: [{ ...country, votes: { '13': -1 } }],
      }).success,
    ).toBe(false);
  });

  it('rejects cities off the globe', () => {
    const [city] = response.cities;
    expect(
      abroadResponseSchema.safeParse({ ...response, cities: [{ ...city, lat: 91 }] }).success,
    ).toBe(false);
  });
});
