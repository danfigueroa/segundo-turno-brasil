import { describe, expect, it } from 'vitest';
import { SimulatedAbroadSource } from '../../src/adapters/simulation/simulated-abroad-source';
import type { AbroadSource } from '../../src/ports/abroad-source';

const inner: AbroadSource = {
  fetchCountries: async () => [
    {
      name: 'Portugal',
      continent: 'EU',
      votes: { '13': 600, '22': 400, '55': 50 },
      sections: { total: 10, counted: 10 },
    },
  ],
};

describe('SimulatedAbroadSource', () => {
  it('starts empty, keeps the two front-runners and ends at the final result', async () => {
    let now = 0;
    const source = new SimulatedAbroadSource(inner, {
      durationMs: 1000,
      startedAt: 0,
      now: () => now,
    });

    const [start] = await source.fetchCountries();
    expect(start).toMatchObject({ votes: { '13': 0, '22': 0 }, sections: { counted: 0 } });

    now = 1000;
    const [end] = await source.fetchCountries();
    expect(end).toMatchObject({ votes: { '13': 600, '22': 400 }, sections: { counted: 10 } });
    expect(end?.votes).not.toHaveProperty('55');
  });
});
