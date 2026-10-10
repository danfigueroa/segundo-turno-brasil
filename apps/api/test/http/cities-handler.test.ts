import { describe, expect, it, vi } from 'vitest';
import { CITIES_LIVE_CACHE, createCitiesHandler } from '../../src/http/cities-handler';
import { FINAL_CACHE, STALE_CACHE } from '../../src/http/results-handler';
import type { CitiesSnapshot } from '../../src/use-cases/get-cities';

const snapshot: CitiesSnapshot = {
  cities: [],
  fetchedAt: '2026-10-25T21:00:00.000Z',
  stale: false,
};
const ok = { execute: vi.fn(async () => snapshot) };
const request = (query = '') => new Request(`http://localhost/api/cities${query}`);

describe('cities handler', () => {
  it('serves the runoff of a state by default with a one-minute CDN cache', async () => {
    const response = await createCitiesHandler({ 1: ok, 2: ok })(request('?uf=sp'));
    expect(ok.execute).toHaveBeenCalledWith('SP');
    expect(response.headers.get('cache-control')).toBe(CITIES_LIVE_CACHE);
    expect(await response.json()).toEqual({ round: 2, uf: 'SP', ...snapshot });
  });

  it('caches the final first round for long', async () => {
    const response = await createCitiesHandler({ 1: ok, 2: ok })(request('?uf=AC&round=1'));
    expect(response.headers.get('cache-control')).toBe(FINAL_CACHE);
  });

  it('uses a short cache when stale and 503 when nothing is available', async () => {
    const stale = { execute: async () => ({ ...snapshot, stale: true }) };
    const down = {
      execute: async (): Promise<CitiesSnapshot> => {
        throw new Error('down');
      },
    };
    const staleResponse = await createCitiesHandler({ 1: ok, 2: stale })(request('?uf=ac'));
    expect(staleResponse.headers.get('cache-control')).toBe(STALE_CACHE);
    const downResponse = await createCitiesHandler({ 1: ok, 2: down })(request('?uf=ac'));
    expect(downResponse.status).toBe(503);
    expect(downResponse.headers.get('cache-control')).toBe('no-store');
  });

  it('rejects missing or unknown states and rounds', async () => {
    const handler = createCitiesHandler({ 1: ok, 2: ok });
    for (const query of ['', '?uf=xx', '?uf=br', '?uf=sp&round=3']) {
      expect((await handler(request(query))).status, query).toBe(400);
    }
  });
});
