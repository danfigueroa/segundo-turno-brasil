import type { Round } from '@stb/domain';
import { useQuery } from '@tanstack/react-query';
import { LIVE_STALE_TIME_MS, pollIntervalOf, type LiveOptions } from './polling';
import { fetchResults } from './results';

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
    queryKey: ['results', round],
    queryFn: ({ signal }) => fetchResults(round, signal),
    enabled: enabled && !(live && paused),
    refetchInterval: (query) =>
      live && pollIntervalOf(query.state.data?.country.sections, { slow }),
    refetchIntervalInBackground: false,
    staleTime: live ? LIVE_STALE_TIME_MS : Infinity,
  });
}
