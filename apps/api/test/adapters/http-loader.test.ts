import { describe, expect, it, vi } from 'vitest';
import {
  createHttpLoader,
  TseRequestError,
  tseResultsUrl,
} from '../../src/adapters/tse/http-loader';

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

  it('fails on non-success responses', async () => {
    const fetch = vi.fn(async () => new Response('not found', { status: 404 }));
    const load = createHttpLoader({ ...options, fetch });
    await expect(load('br')).rejects.toBeInstanceOf(TseRequestError);
  });
});
