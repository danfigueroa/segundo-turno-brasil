import { resultsResponseSchema, type ResultsResponse } from '@stb/contracts';
import type { Round } from '@stb/domain';
import { createJsonFetcher } from './fetch-json';

export { ResultsUnavailableError } from './fetch-json';

const getResults = createJsonFetcher((value) => resultsResponseSchema.parse(value));

/** Fetches and validates the snapshot of one round served by our API. */
export function fetchResults(round: Round, signal?: AbortSignal): Promise<ResultsResponse> {
  return getResults(`/api/results?round=${round}`, signal);
}
