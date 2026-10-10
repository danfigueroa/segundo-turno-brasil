import { describe, expect, it } from 'vitest';
import { ABROAD_LIVE_CACHE, createAbroadHandler } from '../../src/http/abroad-handler';
import { FINAL_CACHE, STALE_CACHE } from '../../src/http/results-handler';
import type { AbroadSnapshot } from '../../src/use-cases/get-abroad';

const snapshot: AbroadSnapshot = {
  countries: [],
  fetchedAt: '2026-10-25T21:00:00.000Z',
  stale: false,
};
const ok = { execute: async () => snapshot };
const request = (query = '') => new Request(`http://localhost/api/abroad${query}`);

describe('abroad handler', () => {
  it('serves the runoff by default with a one-minute CDN cache', async () => {
    const response = await createAbroadHandler({ 1: ok, 2: ok })(request());
    expect(response.headers.get('cache-control')).toBe(ABROAD_LIVE_CACHE);
    expect(await response.json()).toEqual({ round: 2, ...snapshot });
  });

  it('caches the final first round for long', async () => {
    const response = await createAbroadHandler({ 1: ok, 2: ok })(request('?round=1'));
    expect(response.headers.get('cache-control')).toBe(FINAL_CACHE);
  });

  it('uses a short cache when stale and 503 when nothing is available', async () => {
    const stale = { execute: async () => ({ ...snapshot, stale: true }) };
    const down = {
      execute: async (): Promise<AbroadSnapshot> => {
        throw new Error('down');
      },
    };
    const staleResponse = await createAbroadHandler({ 1: ok, 2: stale })(request());
    expect(staleResponse.headers.get('cache-control')).toBe(STALE_CACHE);
    const downResponse = await createAbroadHandler({ 1: ok, 2: down })(request());
    expect(downResponse.status).toBe(503);
    expect(downResponse.headers.get('cache-control')).toBe('no-store');
  });

  it('rejects unknown rounds', async () => {
    expect((await createAbroadHandler({ 1: ok, 2: ok })(request('?round=9'))).status).toBe(400);
  });
});
