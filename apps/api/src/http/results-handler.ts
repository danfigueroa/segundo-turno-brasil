import type { ResultsResponse } from '@stb/contracts';
import type { ResultsSnapshot } from '../use-cases/get-results';

/** Fresh data: CDN serves it for 15s, then revalidates in the background. */
export const FRESH_CACHE = 'public, s-maxage=15, stale-while-revalidate=30, stale-if-error=600';
/** Stale data (TSE unreachable): short CDN cache so recovery shows up quickly. */
export const STALE_CACHE = 'public, s-maxage=5';

export type Handler = (request: Request) => Promise<Response>;

/** `GET /api/results`: the latest snapshot of every scope. */
export function createResultsHandler(getResults: { execute(): Promise<ResultsSnapshot> }): Handler {
  return async (request) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return Response.json(
        { error: 'Method not allowed' },
        { status: 405, headers: { allow: 'GET, HEAD', 'cache-control': 'no-store' } },
      );
    }

    try {
      const snapshot = await getResults.execute();
      const body: ResultsResponse = snapshot;
      return Response.json(body, {
        headers: { 'cache-control': snapshot.stale ? STALE_CACHE : FRESH_CACHE },
      });
    } catch {
      return Response.json(
        { error: 'Results temporarily unavailable' },
        { status: 503, headers: { 'cache-control': 'no-store', 'retry-after': '15' } },
      );
    }
  };
}
