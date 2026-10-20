import { describe, expect, it, vi } from 'vitest';
import { createFixtureCityFiles, createFixtureLoader } from '../../src/adapters/tse/fixture-loader';
import { TseCitiesSource, type TseCityFiles } from '../../src/adapters/tse/tse-cities-source';
import { TseParseError, TseResultsSource } from '../../src/adapters/tse/tse-results-source';
import { FIRST_ROUND_2026, RUNOFF_2026_BEFORE_COUNT } from '../helpers';

/** Fixture files, with every call counted. */
function spiedFiles(dir: string): TseCityFiles {
  const files = createFixtureCityFiles(dir);
  return {
    municipalities: vi.fn(files.municipalities),
    progress: vi.fn(files.progress),
    results: vi.fn(files.results),
  };
}

describe('TseCitiesSource', () => {
  it('adds up to the official state total (real TSE files)', async () => {
    const [cities, snapshot] = await Promise.all([
      new TseCitiesSource(createFixtureCityFiles(FIRST_ROUND_2026)).fetchCities('AC'),
      new TseResultsSource(createFixtureLoader(FIRST_ROUND_2026)).fetchSnapshot(),
    ]);
    const state = snapshot.states.AC;
    expect(cities).toHaveLength(22);
    for (const candidate of state.candidates) {
      const sum = cities.reduce((acc, c) => acc + (c.votes[candidate.number] ?? 0), 0);
      expect(sum, candidate.name).toBe(candidate.votes);
    }
    const total = (pick: (c: (typeof cities)[number]) => number) =>
      cities.reduce((acc, c) => acc + pick(c), 0);
    expect(total((c) => c.electorate)).toBe(state.electorate);
    expect(total((c) => c.turnout)).toBe(state.turnout);
    expect(total((c) => c.ballots.blank + c.ballots.null)).toBe(
      state.votes.blank + state.votes.null,
    );
    expect(total((c) => c.sections.total)).toBe(state.sections.total);
  });

  it('keys municipalities by their IBGE code', async () => {
    const cities = await new TseCitiesSource(createFixtureCityFiles(FIRST_ROUND_2026)).fetchCities(
      'AC',
    );
    expect(cities.find((c) => c.ibge === '1200401')).toMatchObject({
      name: 'RIO BRANCO',
      updatedAt: expect.stringMatching(/^2026-10-0\dT\d{2}:\d{2}:\d{2}-03:00$/),
    });
  });

  it('only downloads municipalities whose count moved', async () => {
    const files = spiedFiles(FIRST_ROUND_2026);
    const source = new TseCitiesSource(files);
    const first = await source.fetchCities('AP');
    expect(files.results).toHaveBeenCalledTimes(16);

    const second = await source.fetchCities('AP');
    expect(files.results).toHaveBeenCalledTimes(16);
    expect(second).toEqual(first);
    expect(files.municipalities).toHaveBeenCalledTimes(1);
  });

  it('keeps the last progress when the progress file fails', async () => {
    const files = spiedFiles(FIRST_ROUND_2026);
    let reads = 0;
    const progress = async (state: string) => {
      reads += 1;
      if (reads === 2) throw new Error('TSE busy');
      return files.progress(state);
    };
    const source = new TseCitiesSource({ ...files, progress });
    const first = await source.fetchCities('AP');
    expect(files.results).toHaveBeenCalledTimes(16);
    expect(await source.fetchCities('AP')).toEqual(first);
    expect(reads).toBe(2);
    expect(files.results).toHaveBeenCalledTimes(16);
  });

  it('downloads a municipality again once its count moves', async () => {
    const files = createFixtureCityFiles(FIRST_ROUND_2026);
    let moved = false;
    const results = vi.fn(files.results);
    const source = new TseCitiesSource({
      ...files,
      results,
      progress: async (state) => {
        const file = (await files.progress(state)) as {
          abr: { cdabr: string; ht: string }[];
        };
        if (!moved) return file;
        return { abr: file.abr.map((m, i) => (i === 0 ? { ...m, ht: '23:59:59' } : m)) };
      },
    });
    await source.fetchCities('AC');
    results.mockClear();
    moved = true;
    await source.fetchCities('AC');
    expect(results).toHaveBeenCalledTimes(1);
  });

  it('downloads everything when the progress file is not published yet', async () => {
    const files = spiedFiles(RUNOFF_2026_BEFORE_COUNT);
    const source = new TseCitiesSource(files);
    const cities = await source.fetchCities('RR');
    expect(cities).toHaveLength(15);
    expect(cities.every((c) => Object.values(c.votes).every((v) => v === 0))).toBe(true);
    await source.fetchCities('RR');
    expect(files.results).toHaveBeenCalledTimes(30);
  });

  it('fails as a whole when one municipality file is invalid', async () => {
    const files = createFixtureCityFiles(FIRST_ROUND_2026);
    const source = new TseCitiesSource({ ...files, results: async () => ({ foo: 1 }) });
    await expect(source.fetchCities('AC')).rejects.toBeInstanceOf(TseParseError);
  });
});
