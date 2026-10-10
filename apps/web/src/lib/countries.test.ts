import type { CountryResult } from '@stb/domain';
import { describe, expect, it } from 'vitest';
import { resultsResponse } from '../../test/fixtures';
import { countryRows, countryStandings, matchesSearch } from './countries';
import { finalistsOf } from './finalists';

const finalists = finalistsOf(resultsResponse().country);
const country = (name: string, lula: number, flavio: number): CountryResult => ({
  name,
  continent: 'EU',
  votes: { '13': lula, '22': flavio, '55': 7 },
  sections: { total: 1, counted: 1 },
  electorate: 100_000,
  turnout: lula + flavio + 9,
  ballots: { valid: lula + flavio + 7, blank: 1, null: 1 },
  updatedAt: '2026-10-04T21:00:00-03:00',
});

describe('countryRows', () => {
  it('keeps countries with votes for the finalists, most voted first', () => {
    const rows = countryRows(
      [country('Japão', 5234, 24601), country('Haiti', 0, 0), country('Portugal', 26401, 19412)],
      finalists,
    );
    expect(rows.map((r) => [r.name, r.votes, r.total, r.leader])).toEqual([
      ['Portugal', [26401, 19412], 45813, '13'],
      ['Japão', [5234, 24601], 29835, '22'],
    ]);
  });
});

describe('countryStandings', () => {
  it('counts wins and names ties', () => {
    const rows = countryRows(
      [country('Japão', 1, 3), country('Guiné-Bissau', 17, 17), country('Portugal', 3, 1)],
      finalists,
    );
    expect(countryStandings(rows, finalists)).toEqual({
      wins: { '13': 1, '22': 1 },
      ties: ['Guiné-Bissau'],
    });
  });
});

describe('matchesSearch', () => {
  it('ignores accents and case', () => {
    expect(matchesSearch('Japão', 'japao')).toBe(true);
    expect(matchesSearch('Estados Unidos', ' UNIDOS ')).toBe(true);
    expect(matchesSearch('Portugal', 'esp')).toBe(false);
  });
});
