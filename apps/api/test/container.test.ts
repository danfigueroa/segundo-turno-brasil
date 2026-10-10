import { describe, expect, it } from 'vitest';
import { SimulatedAbroadSource } from '../src/adapters/simulation/simulated-abroad-source';
import { SimulatedResultsSource } from '../src/adapters/simulation/simulated-results-source';
import { TseAbroadSource } from '../src/adapters/tse/tse-abroad-source';
import { TseResultsSource } from '../src/adapters/tse/tse-results-source';
import { loadConfig } from '../src/config';
import { createAbroadSources, createSources } from '../src/container';
import { FIRST_ROUND_2026 } from './helpers';

describe('createSources', () => {
  it('reads both rounds from the TSE in production', () => {
    const sources = createSources(loadConfig({}));
    expect(sources[1]).toBeInstanceOf(TseResultsSource);
    expect(sources[2]).toBeInstanceOf(TseResultsSource);
  });

  it('replays the runoff but keeps the first round final in simulation', async () => {
    const sources = createSources(
      loadConfig({ DATA_SOURCE: 'simulation', FIXTURES_DIR: FIRST_ROUND_2026 }),
      () => 0,
    );
    expect(sources[2]).toBeInstanceOf(SimulatedResultsSource);
    const firstRound = await sources[1].fetchSnapshot();
    expect(firstRound.country.candidates).toHaveLength(12);
  });
});

describe('createAbroadSources', () => {
  it('reads the cities from the TSE in production', () => {
    const sources = createAbroadSources(loadConfig({}));
    expect(sources[1]).toBeInstanceOf(TseAbroadSource);
    expect(sources[2]).toBeInstanceOf(TseAbroadSource);
  });

  it('replays the runoff abroad in simulation', async () => {
    const sources = createAbroadSources(
      loadConfig({ DATA_SOURCE: 'simulation', FIXTURES_DIR: FIRST_ROUND_2026 }),
      () => 0,
    );
    expect(sources[2]).toBeInstanceOf(SimulatedAbroadSource);
    expect((await sources[1].fetchCountries()).length).toBeGreaterThan(100);
  });
});
