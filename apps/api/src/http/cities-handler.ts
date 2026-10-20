import type { CitiesResponse } from '@stb/contracts';
import { isStateCode, type Round, type StateCode } from '@stb/domain';
import type { CitiesSnapshot } from '../use-cases/get-cities';
import { FINAL_CACHE, STALE_CACHE } from './results-handler';
import { jsonResponse } from './json-response';
import { FINAL_ROUNDS, noStore, parseRound, unexpectedParam, type Handler } from './round';

/** Live breakdown by municipality: refreshed at most once a minute, like the TSE itself. */
export const CITIES_LIVE_CACHE =
  'public, s-maxage=60, stale-while-revalidate=60, stale-if-error=600';

interface RoundCities {
  execute(uf: StateCode): Promise<CitiesSnapshot>;
}

/** `?uf=sp`, in lower case (one CDN cache key per state); `undefined` for anything else. */
function parseState(request: Request): StateCode | undefined {
  const value = new URL(request.url).searchParams.get('uf');
  if (!value || value !== value.toLowerCase()) return undefined;
  const code = value.toUpperCase();
  return isStateCode(code) ? code : undefined;
}

/**
 * `GET /api/cities?uf=xx&round=1|2` (round defaults to 2): every municipality of a state.
 * Like the breakdown abroad, a refresh reads hundreds of TSE files, so the CDN keeps the
 * live count for a minute.
 */
export function createCitiesHandler(rounds: Readonly<Record<Round, RoundCities>>): Handler {
  return async (request) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return noStore(405, 'Method not allowed', { allow: 'GET, HEAD' });
    }
    const unexpected = unexpectedParam(request, ['uf', 'round']);
    if (unexpected) return noStore(400, unexpected);

    const round = parseRound(request);
    if (!round) return noStore(400, 'round must be 1 or 2');
    const uf = parseState(request);
    if (!uf) return noStore(400, 'uf must be a Brazilian state code in lower case');

    try {
      const snapshot = await rounds[round].execute(uf);
      const body: CitiesResponse = { round, uf, ...snapshot };
      const cache = snapshot.stale
        ? STALE_CACHE
        : FINAL_ROUNDS.has(round)
          ? FINAL_CACHE
          : CITIES_LIVE_CACHE;
      return jsonResponse(request, body, { 'cache-control': cache });
    } catch {
      return noStore(503, 'City results temporarily unavailable', { 'retry-after': '60' });
    }
  };
}
