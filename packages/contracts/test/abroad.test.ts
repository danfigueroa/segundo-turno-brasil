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
  fetchedAt: '2026-10-05T15:00:00.000Z',
  stale: false,
};

describe('abroadResponseSchema', () => {
  it('accepts a breakdown by country', () => {
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
});
