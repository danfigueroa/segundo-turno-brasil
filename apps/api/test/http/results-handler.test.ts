import { describe, expect, it } from 'vitest';
import { createResultsHandler, FRESH_CACHE, STALE_CACHE } from '../../src/http/results-handler';
import type { ResultsSnapshot } from '../../src/use-cases/get-results';

const snapshot = { fetchedAt: '2026-10-25T21:00:00.000Z', stale: false } as ResultsSnapshot;
const request = new Request('http://localhost/api/results');

describe('results handler', () => {
  it('returns the snapshot with CDN cache headers', async () => {
    const handler = createResultsHandler({ execute: async () => snapshot });
    const response = await handler(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe(FRESH_CACHE);
    expect(await response.json()).toEqual(snapshot);
  });

  it('uses a short cache for stale snapshots', async () => {
    const handler = createResultsHandler({ execute: async () => ({ ...snapshot, stale: true }) });
    const response = await handler(request);
    expect(response.headers.get('cache-control')).toBe(STALE_CACHE);
  });

  it('responds 503 without caching when results are unavailable', async () => {
    const handler = createResultsHandler({
      execute: async () => {
        throw new Error('TSE down');
      },
    });
    const response = await handler(request);
    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('rejects other methods', async () => {
    const handler = createResultsHandler({ execute: async () => snapshot });
    const response = await handler(new Request(request, { method: 'POST' }));
    expect(response.status).toBe(405);
  });
});
