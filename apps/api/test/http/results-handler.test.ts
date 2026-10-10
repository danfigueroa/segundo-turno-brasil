import { describe, expect, it } from 'vitest';
import {
  createResultsHandler,
  FINAL_CACHE,
  FRESH_CACHE,
  STALE_CACHE,
} from '../../src/http/results-handler';
import type { ResultsSnapshot } from '../../src/use-cases/get-results';

const snapshot = { fetchedAt: '2026-10-25T21:00:00.000Z', stale: false } as ResultsSnapshot;
const live = { execute: async () => snapshot };
const firstRound = { execute: async () => ({ ...snapshot, fetchedAt: 'first' }) };
const request = (query = '') => new Request(`http://localhost/api/results${query}`);

describe('results handler', () => {
  it('serves the runoff by default with live CDN cache headers', async () => {
    const response = await createResultsHandler({ 1: firstRound, 2: live })(request());
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe(FRESH_CACHE);
    expect(await response.json()).toEqual({ round: 2, ...snapshot });
  });

  it('serves the first round with a long cache', async () => {
    const response = await createResultsHandler({ 1: firstRound, 2: live })(request('?round=1'));
    expect(response.headers.get('cache-control')).toBe(FINAL_CACHE);
    expect(await response.json()).toMatchObject({ round: 1, fetchedAt: 'first' });
  });

  it('rejects unknown rounds', async () => {
    const response = await createResultsHandler({ 1: firstRound, 2: live })(request('?round=3'));
    expect(response.status).toBe(400);
  });

  it('uses a short cache for stale snapshots', async () => {
    const stale = { execute: async () => ({ ...snapshot, stale: true }) };
    const response = await createResultsHandler({ 1: firstRound, 2: stale })(request());
    expect(response.headers.get('cache-control')).toBe(STALE_CACHE);
  });

  it('responds 503 without caching when results are unavailable', async () => {
    const failing = {
      execute: async (): Promise<ResultsSnapshot> => {
        throw new Error('TSE down');
      },
    };
    const response = await createResultsHandler({ 1: firstRound, 2: failing })(request());
    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('rejects other methods', async () => {
    const handler = createResultsHandler({ 1: firstRound, 2: live });
    const response = await handler(new Request(request(), { method: 'POST' }));
    expect(response.status).toBe(405);
  });
});
