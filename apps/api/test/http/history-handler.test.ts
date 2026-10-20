import { historyResponseSchema } from '@stb/contracts';
import type { HistoryEntry } from '@stb/domain';
import { describe, expect, it } from 'vitest';
import { createHistoryHandler, HISTORY_CACHE } from '../../src/http/history-handler';
import { STALE_CACHE } from '../../src/http/results-handler';
import type { Latest } from '../../src/use-cases/get-latest';
import { historyEntry } from '../helpers';

const latest: Latest<readonly HistoryEntry[]> = {
  value: [
    historyEntry(10, '2026-10-25T17:10:00-03:00'),
    historyEntry(20, '2026-10-25T17:20:00-03:00'),
  ],
  fetchedAt: '2026-10-25T21:00:00.000Z',
  stale: false,
};
const ok = { execute: async () => latest };
const request = (query = '', method = 'GET') =>
  new Request(`http://localhost/api/history${query}`, { method });
const read = async (response: Response) => historyResponseSchema.parse(await response.json());

describe('history handler', () => {
  it('serves the national curve by default with a one-minute CDN cache', async () => {
    const response = await createHistoryHandler(ok)(request());
    expect(response.headers.get('cache-control')).toBe(HISTORY_CACHE);
    const body = await read(response);
    expect(body.scope).toEqual({ kind: 'country' });
    expect(body.points).toEqual([
      { at: '2026-10-25T17:10:00-03:00', counted: 10, total: 100, votes: { '13': 10, '22': 1 } },
      { at: '2026-10-25T17:20:00-03:00', counted: 20, total: 100, votes: { '13': 20, '22': 1 } },
    ]);
  });

  it('serves a state, abroad or a region', async () => {
    const handler = createHistoryHandler(ok);
    expect((await read(await handler(request('?scope=sp')))).scope).toEqual({
      kind: 'state',
      code: 'SP',
    });
    expect((await read(await handler(request('?scope=zz')))).scope).toEqual({
      kind: 'abroad',
    });
    const region = await read(await handler(request('?scope=regiao-se')));
    expect(region.scope).toEqual({ kind: 'region', code: 'SE' });
    // Sudeste: ES, MG, RJ, SP.
    expect(region.points[0]?.total).toBe(400);
  });

  it('uses a short cache when stale and 503 when nothing is available', async () => {
    const stale = { execute: async () => ({ ...latest, stale: true }) };
    const down = {
      execute: async (): Promise<Latest<readonly HistoryEntry[]>> => {
        throw new Error('down');
      },
    };
    const staleResponse = await createHistoryHandler(stale)(request());
    expect(staleResponse.headers.get('cache-control')).toBe(STALE_CACHE);
    const downResponse = await createHistoryHandler(down)(request());
    expect(downResponse.status).toBe(503);
    expect(downResponse.headers.get('cache-control')).toBe('no-store');
  });

  it('rejects unknown scopes and methods', async () => {
    expect((await createHistoryHandler(ok)(request('?scope=xx'))).status).toBe(400);
    expect((await createHistoryHandler(ok)(request('?scope=regiao-xx'))).status).toBe(400);
    expect((await createHistoryHandler(ok)(request('', 'POST'))).status).toBe(405);
  });

  it('rejects scopes in upper case and unknown parameters', async () => {
    for (const query of ['?scope=SP', '?scope=regiao-NE', '?scope=br&x=1']) {
      expect((await createHistoryHandler(ok)(request(query))).status, query).toBe(400);
    }
  });
});
