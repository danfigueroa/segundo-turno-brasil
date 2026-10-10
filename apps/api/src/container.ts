import { BlobHistoryStore } from './adapters/history/blob-history-store';
import { MemoryHistoryStore } from './adapters/history/memory-history-store';
import { SimulatedAbroadSource } from './adapters/simulation/simulated-abroad-source';
import { SimulatedResultsSource } from './adapters/simulation/simulated-results-source';
import { createFixtureLoader } from './adapters/tse/fixture-loader';
import { createHttpLoader } from './adapters/tse/http-loader';
import { TseAbroadSource } from './adapters/tse/tse-abroad-source';
import { TseResultsSource } from './adapters/tse/tse-results-source';
import type { Round } from '@stb/domain';
import type { Config } from './config';
import { createAbroadHandler } from './http/abroad-handler';
import { createHistoryHandler } from './http/history-handler';
import { createResultsHandler, type Handler } from './http/results-handler';
import type { AbroadSource } from './ports/abroad-source';
import type { HistoryStore } from './ports/history-store';
import type { ResultsSource } from './ports/results-source';
import { GetAbroad } from './use-cases/get-abroad';
import { GetHistory } from './use-cases/get-history';
import { GetResults } from './use-cases/get-results';
import { RecordHistory, recordingSource } from './use-cases/record-history';

function tseLoader(config: Config, electionCode: string) {
  return createHttpLoader({
    baseUrl: config.TSE_BASE_URL,
    electionCode,
    timeoutMs: config.TSE_TIMEOUT_MS,
  });
}

function tseSource(config: Config, electionCode: string): ResultsSource {
  return new TseResultsSource(tseLoader(config, electionCode));
}

/** Where each round's results come from, according to `DATA_SOURCE`. */
export function createSources(
  config: Config,
  now: () => number = Date.now,
): Record<Round, ResultsSource> {
  if (config.DATA_SOURCE === 'tse') {
    return {
      1: tseSource(config, config.TSE_FIRST_ROUND_ELECTION_CODE),
      2: tseSource(config, config.TSE_ELECTION_CODE),
    };
  }

  const firstRound = new TseResultsSource(createFixtureLoader(config.FIXTURES_DIR));
  const runoff =
    config.DATA_SOURCE === 'simulation'
      ? new SimulatedResultsSource(firstRound, {
          durationMs: config.SIMULATION_DURATION_MINUTES * 60_000,
          startedAt: now(),
          now,
        })
      : firstRound;
  return { 1: firstRound, 2: runoff };
}

/** Where each round's breakdown by country comes from, according to `DATA_SOURCE`. */
export function createAbroadSources(
  config: Config,
  now: () => number = Date.now,
): Record<Round, AbroadSource> {
  if (config.DATA_SOURCE === 'tse') {
    return {
      1: new TseAbroadSource(tseLoader(config, config.TSE_FIRST_ROUND_ELECTION_CODE)),
      2: new TseAbroadSource(tseLoader(config, config.TSE_ELECTION_CODE)),
    };
  }

  const firstRound = new TseAbroadSource(createFixtureLoader(config.FIXTURES_DIR));
  const runoff =
    config.DATA_SOURCE === 'simulation'
      ? new SimulatedAbroadSource(firstRound, {
          durationMs: config.SIMULATION_DURATION_MINUTES * 60_000,
          startedAt: now(),
          now,
        })
      : firstRound;
  return { 1: firstRound, 2: runoff };
}

/**
 * Where the runoff count history lives: Vercel Blob for the live TSE count when a token
 * is set, memory otherwise (so simulations never touch the production history).
 */
export function createHistoryStore(config: Config): HistoryStore {
  if (config.DATA_SOURCE === 'tse' && config.BLOB_READ_WRITE_TOKEN) {
    return new BlobHistoryStore({
      pathname: `history/${config.TSE_ELECTION_CODE}.json`,
      token: config.BLOB_READ_WRITE_TOKEN,
    });
  }
  return new MemoryHistoryStore();
}

export interface Routes {
  readonly '/api/results': Handler;
  readonly '/api/abroad': Handler;
  readonly '/api/history': Handler;
}

/** Composition root: wires adapters, use cases and HTTP handlers. */
export function createRoutes(config: Config): Routes {
  const sources = createSources(config);
  const abroadSources = createAbroadSources(config);
  const historyStore = createHistoryStore(config);
  const logError = (event: string, round: Round) => (error: unknown) =>
    console.error(JSON.stringify({ event, round, error: String(error) }));
  const recorder = new RecordHistory(historyStore, {
    onError: logError('history_write_failed', 2),
  });
  const resultSources: Record<Round, ResultsSource> = {
    1: sources[1],
    2: recordingSource(sources[2], recorder),
  };
  const results = (round: Round) =>
    new GetResults(resultSources[round], { onError: logError('results_fetch_failed', round) });
  const abroad = (round: Round) =>
    new GetAbroad(abroadSources[round], { onError: logError('abroad_fetch_failed', round) });
  return {
    '/api/results': createResultsHandler({ 1: results(1), 2: results(2) }),
    '/api/abroad': createAbroadHandler({ 1: abroad(1), 2: abroad(2) }),
    '/api/history': createHistoryHandler(
      new GetHistory(historyStore, { onError: logError('history_read_failed', 2) }),
    ),
  };
}
