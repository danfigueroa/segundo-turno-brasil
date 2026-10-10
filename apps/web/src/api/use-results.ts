import type { Round } from '@stb/domain';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchResults } from './results';

/** Matches the CDN cache (s-maxage=15 + revalidation), so each poll can bring new data. */
export const POLL_INTERVAL_MS = 20_000;

/**
 * Results of one round. The runoff is polled while the tab is visible; the first round
 * is final, so it is fetched once and kept.
 */
export function useResults(round: Round, { enabled = true } = {}) {
  const live = round === 2;
  return useQuery({
    queryKey: ['results', round],
    queryFn: ({ signal }) => fetchResults(round, signal),
    enabled,
    refetchInterval: live ? POLL_INTERVAL_MS : false,
    refetchIntervalInBackground: false,
    staleTime: live ? 0 : Infinity,
    placeholderData: keepPreviousData,
  });
}
