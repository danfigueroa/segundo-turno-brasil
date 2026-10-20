import { describe, expect, it, vi } from 'vitest';
import {
  createHttpCityFiles,
  createHttpLoader,
  TseRequestError,
  tseResultsUrl,
} from '../../src/adapters/tse/http-loader';
import type { Limiter } from '../../src/adapters/tse/limiter';

const options = {
  baseUrl: 'https://tse.test/oficial/ele2026',
  electionCode: '6258',
  timeoutMs: 1000,
};

describe('tseResultsUrl', () => {
  it('builds the presidential results file URL', () => {
    expect(tseResultsUrl(options.baseUrl, options.electionCode, 'sp')).toBe(
      'https://tse.test/oficial/ele2026/6258/dados/sp/sp-c0001-e006258-u.json',
    );
  });
});

describe('createHttpLoader', () => {
  it('returns the parsed JSON body', async () => {
    const fetch = vi.fn(async () => Response.json({ ok: true }));
    const load = createHttpLoader({ ...options, fetch });
    await expect(load('br')).resolves.toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith(
      'https://tse.test/oficial/ele2026/6258/dados/br/br-c0001-e006258-u.json',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('fails on non-success responses, without retrying a 4xx', async () => {
    const fetch = vi.fn(async () => new Response('not found', { status: 404 }));
    const load = createHttpLoader({ ...options, fetch });
    await expect(load('br')).rejects.toBeInstanceOf(TseRequestError);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('retries once after a 5xx or a network error', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(new Response('busy', { status: 503 }))
      .mockResolvedValueOnce(Response.json({ ok: true }));
    await expect(createHttpLoader({ ...options, fetch })('br')).resolves.toEqual({ ok: true });

    const failing = vi.fn<typeof globalThis.fetch>().mockRejectedValue(new TypeError('reset'));
    await expect(createHttpLoader({ ...options, fetch: failing })('br')).rejects.toThrow('reset');
    expect(failing).toHaveBeenCalledTimes(2);
  });

  it('takes a slot of the shared limiter for each attempt', async () => {
    let slots = 0;
    const limit: Limiter = (task) => {
      slots += 1;
      return task();
    };
    const fetch = vi.fn(async () => Response.json({}));
    await createHttpLoader({ ...options, fetch, limit })('br');
    expect(slots).toBe(1);
  });
});

describe('createHttpCityFiles', () => {
  it('reads the municipality list, the progress and the results of a municipality', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => Response.json({}));
    const files = createHttpCityFiles({ ...options, fetch });
    await files.municipalities();
    await files.progress('ac');
    await files.results('ac01120');
    expect(fetch.mock.calls.map(([url]) => String(url))).toEqual([
      'https://tse.test/oficial/ele2026/6258/config/mun-e006258-cm.json',
      'https://tse.test/oficial/ele2026/6258/dados/ac/ac-e006258-ab.json',
      'https://tse.test/oficial/ele2026/6258/dados/ac/ac01120-c0001-e006258-u.json',
    ]);
  });
});
