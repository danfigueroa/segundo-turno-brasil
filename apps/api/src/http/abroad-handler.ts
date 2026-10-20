import type { AbroadResponse } from '@stb/contracts';
import type { Round } from '@stb/domain';
import type { AbroadSnapshot } from '../use-cases/get-abroad';
import { FINAL_CACHE, STALE_CACHE } from './results-handler';
import { jsonResponse } from './json-response';
import { FINAL_ROUNDS, noStore, parseRound, unexpectedParam, type Handler } from './round';

/**
 * Live breakdown by country and city: each refresh reads 186 TSE files, so the CDN keeps it for a
 * minute (the TSE itself updates about once a minute).
 */
export const ABROAD_LIVE_CACHE =
  'public, s-maxage=60, stale-while-revalidate=60, stale-if-error=600';

interface RoundAbroad {
  execute(): Promise<AbroadSnapshot>;
}

/** `GET /api/abroad?round=1|2` (default 2): votes abroad by country and city. */
export function createAbroadHandler(rounds: Readonly<Record<Round, RoundAbroad>>): Handler {
  return async (request) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return noStore(405, 'Method not allowed', { allow: 'GET, HEAD' });
    }
    const unexpected = unexpectedParam(request, ['round']);
    if (unexpected) return noStore(400, unexpected);

    const round = parseRound(request);
    if (!round) return noStore(400, 'round must be 1 or 2');

    try {
      const snapshot = await rounds[round].execute();
      const body: AbroadResponse = { round, ...snapshot };
      const cache = snapshot.stale
        ? STALE_CACHE
        : FINAL_ROUNDS.has(round)
          ? FINAL_CACHE
          : ABROAD_LIVE_CACHE;
      return jsonResponse(request, body, { 'cache-control': cache });
    } catch {
      return noStore(503, 'Abroad results temporarily unavailable', { 'retry-after': '60' });
    }
  };
}
