import { abroadResponseSchema, type AbroadResponse } from '@stb/contracts';
import type { Round } from '@stb/domain';
import { useQuery } from '@tanstack/react-query';
import { LIVE_STALE_TIME_MS, pollIntervalOf, sectionsOf, type LiveOptions } from './polling';
import { createJsonFetcher } from './fetch-json';

const getAbroad = createJsonFetcher((value) => abroadResponseSchema.parse(value));

/** Fetches and validates the breakdown by country of one round. */
export function fetchAbroad(round: Round, signal?: AbortSignal): Promise<AbroadResponse> {
  return getAbroad(`/api/abroad?round=${round}`, signal);
}

/**
 * Votes abroad by country, loaded only while abroad is on screen. The runoff is polled
 * every minute until abroad is fully counted; the first round is final and fetched once.
 */
export function useAbroad(
  round: Round,
  { enabled = true, slow = false, paused = false }: LiveOptions = {},
) {
  const live = round === 2;
  return useQuery({
    queryKey: ['abroad', round],
    queryFn: ({ signal }) => fetchAbroad(round, signal),
    enabled: enabled && !(live && paused),
    refetchInterval: (query) => {
      const countries = query.state.data?.countries;
      return live && pollIntervalOf(countries && sectionsOf(countries), { slow });
    },
    refetchIntervalInBackground: false,
    staleTime: live ? LIVE_STALE_TIME_MS : Infinity,
  });
}
