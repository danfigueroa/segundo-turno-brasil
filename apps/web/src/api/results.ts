import { resultsResponseSchema, type ResultsResponse } from '@stb/contracts';
import type { Round } from '@stb/domain';

export class ResultsUnavailableError extends Error {
  constructor(readonly status: number) {
    super(`Results API responded ${status}`);
    this.name = 'ResultsUnavailableError';
  }
}

/** Fetches and validates the snapshot of one round served by our API. */
export async function fetchResults(round: Round, signal?: AbortSignal): Promise<ResultsResponse> {
  const response = await fetch(`/api/results?round=${round}`, {
    headers: { accept: 'application/json' },
    ...(signal ? { signal } : {}),
  });
  if (!response.ok) throw new ResultsUnavailableError(response.status);
  return resultsResponseSchema.parse(await response.json());
}
