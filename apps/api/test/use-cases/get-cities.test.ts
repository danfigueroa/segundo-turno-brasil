import { describe, expect, it, vi } from 'vitest';
import type { CitiesSource } from '../../src/ports/cities-source';
import { GetCities } from '../../src/use-cases/get-cities';

const rioBranco = {
  ibge: '1200401',
  name: 'RIO BRANCO',
  electorate: 10,
  turnout: 8,
  votes: { '13': 3, '22': 5 },
  ballots: { valid: 8, blank: 0, null: 0 },
  sections: { total: 1, counted: 1 },
  updatedAt: '2026-10-25T21:00:00-03:00',
};
const now = () => new Date('2026-10-25T21:00:00Z');

describe('GetCities', () => {
  it('serves the last good breakdown of a state as stale when the TSE fails', async () => {
    const fetchCities = vi
      .fn<CitiesSource['fetchCities']>()
      .mockResolvedValueOnce([rioBranco])
      .mockRejectedValueOnce(new Error('TSE down'));
    const useCase = new GetCities({ fetchCities }, { now });

    expect(await useCase.execute('AC')).toEqual({
      cities: [rioBranco],
      fetchedAt: '2026-10-25T21:00:00.000Z',
      stale: false,
    });
    expect(await useCase.execute('AC')).toMatchObject({ cities: [rioBranco], stale: true });
  });

  it('shares one request per state between concurrent calls', async () => {
    const fetchCities = vi.fn(async () => [rioBranco]);
    const useCase = new GetCities({ fetchCities });
    await Promise.all([useCase.execute('AC'), useCase.execute('AC'), useCase.execute('SP')]);
    expect(fetchCities).toHaveBeenCalledTimes(2);
    expect(fetchCities.mock.calls).toEqual([['AC'], ['SP']]);
  });

  it('never serves one state for another', async () => {
    const fetchCities = vi
      .fn<CitiesSource['fetchCities']>()
      .mockResolvedValueOnce([rioBranco])
      .mockRejectedValueOnce(new Error('TSE down'));
    const useCase = new GetCities({ fetchCities });
    await useCase.execute('AC');
    await expect(useCase.execute('SP')).rejects.toThrow('TSE down');
  });
});
