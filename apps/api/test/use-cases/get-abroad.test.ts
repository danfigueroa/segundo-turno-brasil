import { describe, expect, it, vi } from 'vitest';
import type { AbroadSource } from '../../src/ports/abroad-source';
import { GetAbroad } from '../../src/use-cases/get-abroad';

const portugal = {
  name: 'Portugal',
  continent: 'EU',
  votes: { '13': 2, '22': 1 },
  sections: { total: 1, counted: 1 },
} as const;
const now = () => new Date('2026-10-25T21:00:00Z');

describe('GetAbroad', () => {
  it('serves the last good breakdown as stale when the TSE fails', async () => {
    const fetchCountries = vi
      .fn<AbroadSource['fetchCountries']>()
      .mockResolvedValueOnce([portugal])
      .mockRejectedValueOnce(new Error('TSE down'));
    const useCase = new GetAbroad({ fetchCountries }, { now });

    expect(await useCase.execute()).toEqual({
      countries: [portugal],
      fetchedAt: '2026-10-25T21:00:00.000Z',
      stale: false,
    });
    expect(await useCase.execute()).toMatchObject({ countries: [portugal], stale: true });
  });

  it('shares one request between concurrent calls', async () => {
    const fetchCountries = vi.fn(async () => [portugal]);
    const useCase = new GetAbroad({ fetchCountries });
    await Promise.all([useCase.execute(), useCase.execute()]);
    expect(fetchCountries).toHaveBeenCalledTimes(1);
  });
});
