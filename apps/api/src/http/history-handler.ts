import type { HistoryResponse } from '@stb/contracts';
import {
  isStateCode,
  REGION_CODES,
  regionSeriesOf,
  seriesOf,
  type CountPoint,
  type HistoryEntry,
  type Scope,
} from '@stb/domain';
import type { Latest } from '../use-cases/get-latest';
import { STALE_CACHE } from './results-handler';
import { jsonResponse } from './json-response';
import { noStore, type Handler } from './round';

/**
 * The history only grows and the client appends the live points it polls, so a minute
 * of CDN cache is plenty.
 */
export const HISTORY_CACHE = 'public, s-maxage=60, stale-while-revalidate=60, stale-if-error=600';

interface History {
  execute(): Promise<Latest<readonly HistoryEntry[]>>;
}

interface HistoryScope {
  readonly scope: Scope;
  readonly series: (entries: readonly HistoryEntry[]) => CountPoint[];
}

/** `?scope=br|zz|<uf>|regiao-<n|ne|co|se|s>` (default `br`); `undefined` for anything else. */
export function parseHistoryScope(request: Request): HistoryScope | undefined {
  const value = (new URL(request.url).searchParams.get('scope') ?? 'br').toUpperCase();
  if (value === 'BR') return { scope: { kind: 'country' }, series: (e) => seriesOf(e, 'BR') };
  if (value === 'ZZ') return { scope: { kind: 'abroad' }, series: (e) => seriesOf(e, 'ZZ') };
  if (isStateCode(value)) {
    return { scope: { kind: 'state', code: value }, series: (e) => seriesOf(e, value) };
  }
  const region = REGION_CODES.find((code) => value === `REGIAO-${code}`);
  if (region) {
    return { scope: { kind: 'region', code: region }, series: (e) => regionSeriesOf(e, region) };
  }
  return undefined;
}

/** `GET /api/history?scope=…`: how the runoff count of one scope evolved. */
export function createHistoryHandler(history: History): Handler {
  return async (request) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return noStore(405, 'Method not allowed', { allow: 'GET, HEAD' });
    }

    const selected = parseHistoryScope(request);
    if (!selected) return noStore(400, 'scope must be br, zz, a state or regiao-<region>');

    try {
      const { value, fetchedAt, stale } = await history.execute();
      const body: HistoryResponse = {
        scope: selected.scope,
        points: selected.series(value),
        fetchedAt,
        stale,
      };
      return jsonResponse(request, body, {
        'cache-control': stale ? STALE_CACHE : HISTORY_CACHE,
      });
    } catch {
      return noStore(503, 'History temporarily unavailable', { 'retry-after': '60' });
    }
  };
}
