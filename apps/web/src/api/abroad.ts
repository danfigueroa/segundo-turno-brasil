import { abroadResponseSchema, type AbroadResponse } from '@stb/contracts';
import type { Round } from '@stb/domain';
import { useQuery } from '@tanstack/react-query';
import { ResultsUnavailableError } from './results';

/** Matches the one-minute CDN cache of the breakdown by country. */
export const ABROAD_POLL_INTERVAL_MS = 60_000;

/** Fetches and validates the breakdown by country of one round. */
export async function fetchAbroad(round: Round, signal?: AbortSignal): Promise<AbroadResponse> {
  const response = await fetch(`/api/abroad?round=${round}`, {
    headers: { accept: 'application/json' },
    ...(signal ? { signal } : {}),
  });
  if (!response.ok) throw new ResultsUnavailableError(response.status);
  return abroadResponseSchema.parse(await response.json());
}

/**
 * Votes abroad by country, loaded only while abroad is on screen. The runoff is polled
 * every minute; the first round is final and fetched once.
 */
export function useAbroad(round: Round, { enabled = true } = {}) {
  const live = round === 2;
  return useQuery({
    queryKey: ['abroad', round],
    queryFn: ({ signal }) => fetchAbroad(round, signal),
    enabled,
    refetchInterval: live ? ABROAD_POLL_INTERVAL_MS : false,
    refetchIntervalInBackground: false,
    staleTime: live ? 0 : Infinity,
  });
}
