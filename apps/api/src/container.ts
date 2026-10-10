import { SimulatedResultsSource } from './adapters/simulation/simulated-results-source';
import { createFixtureLoader } from './adapters/tse/fixture-loader';
import { createHttpLoader } from './adapters/tse/http-loader';
import { TseResultsSource } from './adapters/tse/tse-results-source';
import type { Config } from './config';
import { createResultsHandler, type Handler } from './http/results-handler';
import type { ResultsSource } from './ports/results-source';
import { GetResults } from './use-cases/get-results';

export function createSource(config: Config, now: () => number = Date.now): ResultsSource {
  switch (config.DATA_SOURCE) {
    case 'tse':
      return new TseResultsSource(
        createHttpLoader({
          baseUrl: config.TSE_BASE_URL,
          electionCode: config.TSE_ELECTION_CODE,
          timeoutMs: config.TSE_TIMEOUT_MS,
        }),
      );
    case 'fixture':
      return new TseResultsSource(createFixtureLoader(config.FIXTURES_DIR));
    case 'simulation':
      return new SimulatedResultsSource(
        new TseResultsSource(createFixtureLoader(config.FIXTURES_DIR)),
        { durationMs: config.SIMULATION_DURATION_MINUTES * 60_000, startedAt: now(), now },
      );
  }
}

export interface Routes {
  readonly '/api/results': Handler;
}

/** Composition root: wires adapters, use cases and HTTP handlers. */
export function createRoutes(config: Config): Routes {
  const getResults = new GetResults(createSource(config), {
    onError: (error) =>
      console.error(JSON.stringify({ event: 'results_fetch_failed', error: String(error) })),
  });
  return { '/api/results': createResultsHandler(getResults) };
}
