import { describe, expect, it } from 'vitest';
import { SimulatedCitiesSource } from '../../src/adapters/simulation/simulated-cities-source';
import { createFixtureCityFiles } from '../../src/adapters/tse/fixture-loader';
import { TseCitiesSource } from '../../src/adapters/tse/tse-cities-source';
import { FIRST_ROUND_2026 } from '../helpers';

describe('SimulatedCitiesSource', () => {
  const inner = new TseCitiesSource(createFixtureCityFiles(FIRST_ROUND_2026));

  it('starts empty, keeps the two front-runners and ends at the final result', async () => {
    let now = 0;
    const source = new SimulatedCitiesSource(inner, {
      durationMs: 1000,
      startedAt: 0,
      now: () => now,
    });

    const start = await source.fetchCities('AC');
    expect(start.every((c) => c.sections.counted === 0 && c.turnout === 0)).toBe(true);
    expect(start.every((c) => Object.values(c.votes).every((v) => v === 0))).toBe(true);

    now = 1000;
    const [end, final] = await Promise.all([source.fetchCities('AC'), inner.fetchCities('AC')]);
    const rioBranco = end.find((c) => c.ibge === '1200401');
    const finalRioBranco = final.find((c) => c.ibge === '1200401');
    expect(Object.keys(rioBranco?.votes ?? {}).sort()).toEqual(['13', '22']);
    expect(rioBranco?.votes['13']).toBe(finalRioBranco?.votes['13']);
    expect(rioBranco?.sections.counted).toBe(finalRioBranco?.sections.total);
    expect(rioBranco?.ballots.valid).toBe(
      (finalRioBranco?.votes['13'] ?? 0) + (finalRioBranco?.votes['22'] ?? 0),
    );
  });
});
