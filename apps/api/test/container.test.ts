import { describe, expect, it } from 'vitest';
import { citiesResponseSchema, historyResponseSchema } from '@stb/contracts';
import { BlobHistoryStore } from '../src/adapters/history/blob-history-store';
import { MemoryHistoryStore } from '../src/adapters/history/memory-history-store';
import { SimulatedAbroadSource } from '../src/adapters/simulation/simulated-abroad-source';
import { SimulatedCitiesSource } from '../src/adapters/simulation/simulated-cities-source';
import { SimulatedResultsSource } from '../src/adapters/simulation/simulated-results-source';
import { TseAbroadSource } from '../src/adapters/tse/tse-abroad-source';
import { TseCitiesSource } from '../src/adapters/tse/tse-cities-source';
import { TseResultsSource } from '../src/adapters/tse/tse-results-source';
import { loadConfig } from '../src/config';
import {
  createAbroadSources,
  createCitiesSources,
  createHistoryStore,
  createRoutes,
  createSources,
} from '../src/container';
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
    expect((await sources[1].fetchAbroad()).countries.length).toBeGreaterThan(100);
  });
});

describe('createCitiesSources', () => {
  it('reads the municipalities from the TSE in production', () => {
    const sources = createCitiesSources(loadConfig({}));
    expect(sources[1]).toBeInstanceOf(TseCitiesSource);
    expect(sources[2]).toBeInstanceOf(TseCitiesSource);
  });

  it('replays the runoff by municipality in simulation', async () => {
    const sources = createCitiesSources(
      loadConfig({ DATA_SOURCE: 'simulation', FIXTURES_DIR: FIRST_ROUND_2026 }),
      () => 0,
    );
    expect(sources[2]).toBeInstanceOf(SimulatedCitiesSource);
    expect(await sources[1].fetchCities('RR')).toHaveLength(15);
  });
});

describe('createHistoryStore', () => {
  it('uses Vercel Blob for the live TSE count when a token is set', () => {
    const store = createHistoryStore(loadConfig({ BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_x' }));
    expect(store).toBeInstanceOf(BlobHistoryStore);
  });

  it('uses Vercel Blob with OIDC when only the store id is set', () => {
    const store = createHistoryStore(loadConfig({ BLOB_STORE_ID: 'store_abc' }));
    expect(store).toBeInstanceOf(BlobHistoryStore);
  });

  it('stays in memory without a token or outside the live TSE count', () => {
    expect(createHistoryStore(loadConfig({}))).toBeInstanceOf(MemoryHistoryStore);
    const simulation = loadConfig({ DATA_SOURCE: 'simulation', BLOB_READ_WRITE_TOKEN: 'x' });
    expect(createHistoryStore(simulation)).toBeInstanceOf(MemoryHistoryStore);
  });
});

describe('createRoutes', () => {
  it('records the runoff results it serves in the history', async () => {
    const routes = createRoutes(
      loadConfig({ DATA_SOURCE: 'fixture', FIXTURES_DIR: FIRST_ROUND_2026 }),
    );
    await routes['/api/results'](new Request('http://localhost/api/results'));
    const response = await routes['/api/history'](new Request('http://localhost/api/history'));
    const body = historyResponseSchema.parse(await response.json());
    expect(body.points).toHaveLength(1);
    expect(body.points[0]?.counted).toBe(body.points[0]?.total);
  });

  it('serves the municipalities of a state', async () => {
    const routes = createRoutes(
      loadConfig({ DATA_SOURCE: 'fixture', FIXTURES_DIR: FIRST_ROUND_2026 }),
    );
    const response = await routes['/api/cities'](
      new Request('http://localhost/api/cities?uf=ap&round=1'),
    );
    const body = citiesResponseSchema.parse(await response.json());
    expect(body).toMatchObject({ round: 1, uf: 'AP', stale: false });
    expect(body.cities).toHaveLength(16);
  });
});
