import { afterEach, describe, expect, it, vi } from 'vitest';
import { createJsonFetcher, ResultsUnavailableError } from './fetch-json';

const json = (body: unknown, etag?: string) =>
  Response.json(body, etag ? { headers: { etag } } : {});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createJsonFetcher', () => {
  it('parses each new version, and returns the same value for the same ETag', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(json({ n: 1 }, 'W/"a"'))
      .mockResolvedValueOnce(json({ n: 1 }, 'W/"a"'))
      .mockResolvedValueOnce(json({ n: 2 }, 'W/"b"'));
    vi.stubGlobal('fetch', fetch);
    const parse = vi.fn((value: unknown) => ({ ...(value as object) }));
    const get = createJsonFetcher(parse);

    const first = await get('/api/x');
    expect(await get('/api/x')).toBe(first);
    expect(parse).toHaveBeenCalledOnce();
    expect(await get('/api/x')).toEqual({ n: 2 });
    expect(parse).toHaveBeenCalledTimes(2);
  });

  it('keeps one version per URL, and parses responses without an ETag', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => json({ n: 1 }));
    vi.stubGlobal('fetch', fetch);
    const parse = vi.fn((value: unknown) => value);
    const get = createJsonFetcher(parse);
    await get('/api/x');
    await get('/api/x');
    expect(parse).toHaveBeenCalledTimes(2);
  });

  it('fails with the status of an error response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('down', { status: 503 })),
    );
    const get = createJsonFetcher((value) => value);
    await expect(get('/api/x')).rejects.toEqual(new ResultsUnavailableError(503));
  });
});
