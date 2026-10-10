import { SimulatedResultsSource } from './adapters/simulation/simulated-results-source';
import { createFixtureLoader } from './adapters/tse/fixture-loader';
import { createHttpLoader } from './adapters/tse/http-loader';
import { TseResultsSource } from './adapters/tse/tse-results-source';
import type { Round } from '@stb/domain';
import type { Config } from './config';
import { createResultsHandler, type Handler } from './http/results-handler';
import type { ResultsSource } from './ports/results-source';
import { GetResults } from './use-cases/get-results';

function tseSource(config: Config, electionCode: string): ResultsSource {
  return new TseResultsSource(
    createHttpLoader({
      baseUrl: config.TSE_BASE_URL,
      electionCode,
      timeoutMs: config.TSE_TIMEOUT_MS,
    }),
  );
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

export interface Routes {
  readonly '/api/results': Handler;
}

/** Composition root: wires adapters, use cases and HTTP handlers. */
export function createRoutes(config: Config): Routes {
  const sources = createSources(config);
  const useCase = (round: Round) =>
    new GetResults(sources[round], {
      onError: (error) =>
        console.error(
          JSON.stringify({ event: 'results_fetch_failed', round, error: String(error) }),
        ),
    });
  return { '/api/results': createResultsHandler({ 1: useCase(1), 2: useCase(2) }) };
}
