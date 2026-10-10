import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchResults } from './results';

/** Matches the CDN cache (s-maxage=15 + revalidation), so each poll can bring new data. */
export const POLL_INTERVAL_MS = 20_000;

/** Live results, polled while the tab is visible. */
export function useResults() {
  return useQuery({
    queryKey: ['results'],
    queryFn: ({ signal }) => fetchResults(signal),
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    placeholderData: keepPreviousData,
  });
}
