import { citiesResponseSchema, type CitiesResponse } from '@stb/contracts';
import type { Round, StateCode } from '@stb/domain';
import { useQuery } from '@tanstack/react-query';
import { LIVE_STALE_TIME_MS, pollIntervalOf, sectionsOf, type LiveOptions } from './polling';
import { ResultsUnavailableError } from './results';

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
 * screen. The runoff is polled every minute until the state is fully counted; the first
 * round is final and fetched once.
 */
export function useCities(
  round: Round,
  uf: StateCode | undefined,
  { enabled = true, slow = false, paused = false }: LiveOptions = {},
) {
  const live = round === 2;
  return useQuery({
    queryKey: ['cities', round, uf],
    queryFn: ({ signal }) =>
      uf ? fetchCities(round, uf, signal) : Promise.reject(new Error('No state selected')),
    enabled: enabled && uf !== undefined && !(live && paused),
    refetchInterval: (query) => {
      const cities = query.state.data?.cities;
      return live && pollIntervalOf(cities && sectionsOf(cities), { slow });
    },
    refetchIntervalInBackground: false,
    staleTime: live ? LIVE_STALE_TIME_MS : Infinity,
  });
}
