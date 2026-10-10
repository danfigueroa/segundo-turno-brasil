import { resultsResponseSchema, type ResultsResponse } from '@stb/contracts';

export class ResultsUnavailableError extends Error {
  constructor(readonly status: number) {
    super(`Results API responded ${status}`);
    this.name = 'ResultsUnavailableError';
  }
}

/** Fetches and validates the snapshot served by our API. */
export async function fetchResults(signal?: AbortSignal): Promise<ResultsResponse> {
  const response = await fetch('/api/results', {
    headers: { accept: 'application/json' },
    ...(signal ? { signal } : {}),
  });
  if (!response.ok) throw new ResultsUnavailableError(response.status);
  return resultsResponseSchema.parse(await response.json());
}
