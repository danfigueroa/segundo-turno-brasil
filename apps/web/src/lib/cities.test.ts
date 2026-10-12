import type { MunicipalityResult } from '@stb/domain';
import { describe, expect, it } from 'vitest';
import { resultsResponse } from '../../test/fixtures';
import { cityRows, cityWins, sortCityRows } from './cities';
import { finalistsOf } from './finalists';

const finalists = finalistsOf(resultsResponse().country);

function city(ibge: string, name: string, electorate: number, votes: Record<string, number>) {
  const sections = { total: 1, counted: 1 };
  const ballots = { valid: 0, blank: 0, null: 0 };
  const updatedAt = '2026-10-25T20:00:00-03:00';
  return { ibge, name, electorate, turnout: 0, votes, ballots, sections, updatedAt };
}

const cities: MunicipalityResult[] = [
  city('1200013', 'ACRELÂNDIA', 11000, { '13': 3000, '22': 5000, '55': 10 }),
  city('1200401', 'RIO BRANCO', 280000, { '13': 60000, '22': 140000 }),
  city('1200054', 'ASSIS BRASIL', 6000, { '13': 2000, '22': 2000 }),
  city('1200104', 'BRASILÉIA', 20000, {}),
];

describe('cityRows', () => {
  it('lists the finalists of each municipality, biggest electorate first', () => {
    expect(cityRows(cities, finalists)).toEqual([
      {
        ibge: '1200401',
        name: 'Rio Branco',
        electorate: 280000,
        votes: [60000, 140000],
        total: 200000,
        leader: '22',
        margin: 40,
        pending: 0,
      },
      {
        ibge: '1200104',
        name: 'Brasiléia',
        electorate: 20000,
        votes: [0, 0],
        total: 0,
        leader: undefined,
        margin: 0,
        pending: 0,
      },
      {
        ibge: '1200013',
        name: 'Acrelândia',
        electorate: 11000,
        votes: [3000, 5000],
        total: 8000,
        leader: '22',
        margin: 25,
        pending: 0,
      },
      {
        ibge: '1200054',
        name: 'Assis Brasil',
        electorate: 6000,
        votes: [2000, 2000],
        total: 4000,
        leader: undefined,
        margin: 0,
        pending: 0,
      },
    ]);
  });
});

describe('cityWins', () => {
  it('counts where each finalist leads, ignoring ties and empty counts', () => {
    expect(cityWins(cityRows(cities, finalists), finalists)).toEqual({ '13': 0, '22': 2 });
  });
});

describe('sortCityRows', () => {
  const pending = (ibge: string, left: number) => {
    const found = cities.find((c) => c.ibge === ibge);
    if (!found) throw new Error(ibge);
    return { ...found, sections: { total: 10, counted: 10 - left } };
  };
  const rows = cityRows(
    [pending('1200401', 1), pending('1200104', 9), pending('1200013', 0), pending('1200054', 1)],
    finalists,
  );
  const names = (order: Parameters<typeof sortCityRows>[1]) =>
    sortCityRows(rows, order).map((row) => row.name);

  it('ranks by electorate', () => {
    expect(names('electorate')).toEqual(['Rio Branco', 'Brasiléia', 'Acrelândia', 'Assis Brasil']);
  });

  it('ranks by the widest lead, bigger cities first on a tie', () => {
    expect(names('margin')).toEqual(['Rio Branco', 'Acrelândia', 'Brasiléia', 'Assis Brasil']);
  });

  it('ranks by the sections still to count, bigger cities first on a tie', () => {
    expect(names('pending')).toEqual(['Brasiléia', 'Rio Branco', 'Assis Brasil', 'Acrelândia']);
  });
});
