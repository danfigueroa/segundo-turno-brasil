import { describe, expect, it, vi } from 'vitest';
import type { AbroadSource } from '../../src/ports/abroad-source';
import { GetAbroad } from '../../src/use-cases/get-abroad';

const portugal = {
  name: 'Portugal',
  continent: 'EU',
  votes: { '13': 2, '22': 1 },
  sections: { total: 1, counted: 1 },
  electorate: 10,
  turnout: 4,
  ballots: { valid: 3, blank: 0, null: 1 },
  updatedAt: '2026-10-25T18:00:00-03:00',
} as const;
const breakdown = { countries: [portugal], cities: [] };
const now = () => new Date('2026-10-25T21:00:00Z');

describe('GetAbroad', () => {
  it('serves the last good breakdown as stale when the TSE fails', async () => {
    const fetchAbroad = vi
      .fn<AbroadSource['fetchAbroad']>()
      .mockResolvedValueOnce(breakdown)
      .mockRejectedValueOnce(new Error('TSE down'));
    const useCase = new GetAbroad({ fetchAbroad }, { now });

    expect(await useCase.execute()).toEqual({
      countries: [portugal],
      cities: [],
      fetchedAt: '2026-10-25T21:00:00.000Z',
      stale: false,
    });
    expect(await useCase.execute()).toMatchObject({ countries: [portugal], stale: true });
  });

  it('shares one request between concurrent calls', async () => {
    const fetchAbroad = vi.fn(async () => breakdown);
    const useCase = new GetAbroad({ fetchAbroad });
    await Promise.all([useCase.execute(), useCase.execute()]);
    expect(fetchAbroad).toHaveBeenCalledTimes(1);
  });
});
