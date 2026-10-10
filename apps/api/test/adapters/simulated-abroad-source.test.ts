import { describe, expect, it } from 'vitest';
import { SimulatedAbroadSource } from '../../src/adapters/simulation/simulated-abroad-source';
import type { AbroadSource } from '../../src/ports/abroad-source';

const lisbon = {
  code: '30392',
  name: 'LISBOA',
  country: 'Portugal',
  continent: 'EU',
  lat: 38.7,
  lon: -9.1,
  electorate: 2000,
  votes: { '13': 600, '22': 400, '55': 50 },
  sections: { total: 10, counted: 10 },
} as const;

const inner: AbroadSource = {
  fetchAbroad: async () => ({
    countries: [
      { name: 'Portugal', continent: 'EU', votes: lisbon.votes, sections: lisbon.sections },
    ],
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
  });
});
