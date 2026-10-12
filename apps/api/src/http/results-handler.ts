import type { ResultsResponse } from '@stb/contracts';
import type { Round } from '@stb/domain';
import type { ResultsSnapshot } from '../use-cases/get-results';
import { jsonResponse } from './json-response';
import { FINAL_ROUNDS, noStore, parseRound, type Handler } from './round';

export type { Handler } from './round';

/** Fresh live data: CDN serves it for 15s, then revalidates in the background. */
export const FRESH_CACHE = 'public, s-maxage=15, stale-while-revalidate=30, stale-if-error=600';
/** Final results (first round): cached for an hour, served stale for a day if needed. */
export const FINAL_CACHE =
  'public, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=86400';
/** Stale data (TSE unreachable): short CDN cache so recovery shows up quickly. */
export const STALE_CACHE = 'public, s-maxage=5';

interface RoundResults {
  execute(): Promise<ResultsSnapshot>;
}

/** `GET /api/results?round=1|2` (default 2): the latest snapshot of every scope. */
export function createResultsHandler(rounds: Readonly<Record<Round, RoundResults>>): Handler {
  return async (request) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return noStore(405, 'Method not allowed', { allow: 'GET, HEAD' });
    }

    const round = parseRound(request);
    if (!round) return noStore(400, 'round must be 1 or 2');

    try {
      const snapshot = await rounds[round].execute();
      const body: ResultsResponse = { round, ...snapshot };
      const cache = snapshot.stale
        ? STALE_CACHE
        : FINAL_ROUNDS.has(round)
          ? FINAL_CACHE
          : FRESH_CACHE;
      return jsonResponse(request, body, { 'cache-control': cache });
    } catch {
      return noStore(503, 'Results temporarily unavailable', { 'retry-after': '15' });
    }
  };
}
