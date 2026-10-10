import { describe, expect, it } from 'vitest';
import { ABROAD_CITIES } from '../../src/adapters/tse/abroad-cities';
import { createFixtureLoader } from '../../src/adapters/tse/fixture-loader';
import { tseResultsUrl } from '../../src/adapters/tse/http-loader';
import { TseAbroadSource } from '../../src/adapters/tse/tse-abroad-source';
import { TseParseError, TseResultsSource } from '../../src/adapters/tse/tse-results-source';
import { FIRST_ROUND_2026, RUNOFF_2026_BEFORE_COUNT } from '../helpers';

describe('TseAbroadSource', () => {
  it('maps every one of the 186 cities abroad to a country', () => {
    expect(Object.keys(ABROAD_CITIES)).toHaveLength(186);
  });

  it('adds the cities of a country together', async () => {
    const countries = await new TseAbroadSource(
      createFixtureLoader(FIRST_ROUND_2026),
    ).fetchCountries();
    const usa = countries.find((c) => c.name === 'Estados Unidos');
    expect(usa?.continent).toBe('AM');
    // Eleven consulates: Atlanta, Boston, Chicago, Hartford, Houston, Los Angeles, Miami,
    // Nova York, Orlando, São Francisco and Washington.
    expect(Object.values(ABROAD_CITIES).filter((c) => c.country === 'Estados Unidos')).toHaveLength(
      11,
    );
    expect(usa?.sections.counted).toBe(usa?.sections.total);
  });

  it('adds up to the official abroad total (real TSE files)', async () => {
    const loader = createFixtureLoader(FIRST_ROUND_2026);
    const [countries, snapshot] = await Promise.all([
      new TseAbroadSource(loader).fetchCountries(),
      new TseResultsSource(loader).fetchSnapshot(),
    ]);
    for (const candidate of snapshot.abroad.candidates) {
      const sum = countries.reduce((acc, c) => acc + (c.votes[candidate.number] ?? 0), 0);
      expect(sum, candidate.name).toBe(candidate.votes);
    }
    const sections = countries.reduce((acc, c) => acc + c.sections.total, 0);
    expect(sections).toBe(snapshot.abroad.sections.total);
  });

  it('reads the runoff files published with zero votes', async () => {
    const countries = await new TseAbroadSource(
      createFixtureLoader(RUNOFF_2026_BEFORE_COUNT),
    ).fetchCountries();
    expect(countries.every((c) => Object.values(c.votes).every((v) => v === 0))).toBe(true);
    expect(Object.keys(countries[0]?.votes ?? {}).sort()).toEqual(['13', '22']);
  });

  it('fails as a whole when one city file is invalid', async () => {
    const source = new TseAbroadSource(async () => ({ foo: 1 }), {
      cities: { '29254': { city: 'ABIDJÃ', country: 'Costa do Marfim', continent: 'AF' } },
    });
    await expect(source.fetchCountries()).rejects.toBeInstanceOf(TseParseError);
  });
});

describe('tseResultsUrl', () => {
  it('places city files in their state folder', () => {
    expect(tseResultsUrl('https://x/ele2026', '6257', 'zz29254')).toBe(
      'https://x/ele2026/6257/dados/zz/zz29254-c0001-e006257-u.json',
    );
  });
});
