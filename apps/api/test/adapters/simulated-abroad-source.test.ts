import { describe, expect, it } from 'vitest';
import { SimulatedAbroadSource } from '../../src/adapters/simulation/simulated-abroad-source';
import { aggregateCountries } from '@stb/domain';
import type { AbroadSource } from '../../src/ports/abroad-source';

const lisbon = {
  code: '30392',
  name: 'LISBOA',
  country: 'Portugal',
  continent: 'EU',
  lat: 38.7,
  lon: -9.1,
  electorate: 2000,
  turnout: 1100,
  votes: { '13': 600, '22': 400, '55': 50 },
  ballots: { valid: 1050, blank: 20, null: 30 },
  sections: { total: 10, counted: 10 },
  updatedAt: '2026-10-25T20:00:00-03:00',
} as const;

const inner: AbroadSource = {
  fetchAbroad: async () => ({
    countries: aggregateCountries([lisbon]),
    cities: [lisbon],
  }),
};

describe('SimulatedAbroadSource', () => {
  it('starts empty, keeps the two front-runners and ends at the final result', async () => {
    let now = 0;
    const source = new SimulatedAbroadSource(inner, {
      durationMs: 1000,
      startedAt: 0,
      now: () => now,
    });

    const start = await source.fetchAbroad();
    expect(start.cities[0]).toMatchObject({
      votes: { '13': 0, '22': 0 },
      sections: { counted: 0 },
    });

    now = 1000;
    const end = await source.fetchAbroad();
    expect(end.cities[0]).toMatchObject({
      votes: { '13': 600, '22': 400 },
      // Only the front-runners' votes count as valid in the replay.
      ballots: { valid: 1000, blank: 20, null: 30 },
      turnout: 1050,
      sections: { counted: 10 },
    });
    expect(end.cities[0]?.votes).not.toHaveProperty('55');
  });

  it('adds the simulated cities up into countries', async () => {
    const source = new SimulatedAbroadSource(inner, {
      durationMs: 1000,
      startedAt: 0,
      now: () => 500,
    });
    const { countries, cities } = await source.fetchAbroad();
    expect(countries[0]?.votes).toEqual(cities[0]?.votes);
    expect(countries[0]?.sections).toEqual(cities[0]?.sections);
    expect(countries[0]?.ballots).toEqual(cities[0]?.ballots);
    expect(countries[0]?.turnout).toBe(cities[0]?.turnout);
  });
});
