import { describe, expect, it } from 'vitest';
import { historyResponseSchema } from '@stb/contracts';
import { BlobHistoryStore } from '../src/adapters/history/blob-history-store';
import { MemoryHistoryStore } from '../src/adapters/history/memory-history-store';
import { SimulatedAbroadSource } from '../src/adapters/simulation/simulated-abroad-source';
import { SimulatedResultsSource } from '../src/adapters/simulation/simulated-results-source';
import { TseAbroadSource } from '../src/adapters/tse/tse-abroad-source';
import { TseResultsSource } from '../src/adapters/tse/tse-results-source';
import { loadConfig } from '../src/config';
import {
  createAbroadSources,
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
});
