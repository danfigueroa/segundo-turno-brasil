import { citiesResponseSchema, type CitiesResponse } from '@stb/contracts';
import type { Round, StateCode } from '@stb/domain';
import { useQuery } from '@tanstack/react-query';
import { ResultsUnavailableError } from './results';

/** Matches the one-minute CDN cache of the breakdown by municipality. */
export const CITIES_POLL_INTERVAL_MS = 60_000;

/** Fetches and validates the municipalities of one state in one round. */
export async function fetchCities(
  round: Round,
  uf: StateCode,
  signal?: AbortSignal,
): Promise<CitiesResponse> {
  const response = await fetch(`/api/cities?uf=${uf.toLowerCase()}&round=${round}`, {
    headers: { accept: 'application/json' },
    ...(signal ? { signal } : {}),
  });
  if (!response.ok) throw new ResultsUnavailableError(response.status);
  return citiesResponseSchema.parse(await response.json());
}

/**
 * Municipalities of a state, loaded only while that state (or one of its cities) is on
 * screen. The runoff is polled every minute; the first round is final and fetched once.
 */
export function useCities(round: Round, uf: StateCode | undefined, { enabled = true } = {}) {
  const live = round === 2;
  return useQuery({
    queryKey: ['cities', round, uf],
    queryFn: ({ signal }) =>
      uf ? fetchCities(round, uf, signal) : Promise.reject(new Error('No state selected')),
    enabled: enabled && uf !== undefined,
    refetchInterval: live ? CITIES_POLL_INTERVAL_MS : false,
    refetchIntervalInBackground: false,
    staleTime: live ? 0 : Infinity,
  });
}
