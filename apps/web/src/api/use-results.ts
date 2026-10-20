import type { Round } from '@stb/domain';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { LIVE_STALE_TIME_MS, pollIntervalOf, type LiveOptions } from './polling';
import { fetchResults } from './results';

/** Key, fetch and freshness of one round's results, shared by the hook and the prefetch. */
export function resultsQuery(round: Round) {
  return queryOptions({
    queryKey: ['results', round],
    queryFn: ({ signal }) => fetchResults(round, signal),
    staleTime: round === 2 ? LIVE_STALE_TIME_MS : Infinity,
  });
}

/**
 * Results of one round. The runoff is polled while the tab is visible until the national
 * count is complete; the first round is final, so it is fetched once and kept.
 */
export function useResults(
  round: Round,
  { enabled = true, slow = false, paused = false }: LiveOptions = {},
) {
  const live = round === 2;
  return useQuery({
    ...resultsQuery(round),
    enabled: enabled && !(live && paused),
    refetchInterval: (query) =>
      live && pollIntervalOf(query.state.data?.country.sections, { slow }),
    refetchIntervalInBackground: false,
  });
}
