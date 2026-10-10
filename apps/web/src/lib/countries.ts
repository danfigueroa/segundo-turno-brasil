import type { CountryResult } from '@stb/domain';
import type { Finalist } from './finalists';

export interface CountryRow {
  readonly name: string;
  readonly continent: CountryResult['continent'];
  /** Votes of each finalist, in display order. */
  readonly votes: readonly number[];
  /** Votes of the two finalists together. */
  readonly total: number;
  /** Ballot number of the most voted finalist; `undefined` on a tie. */
  readonly leader: string | undefined;
}

/**
 * Countries where at least one finalist got a vote, most votes first. Only the two
 * finalists count, as in the design ("Votos nos 2 candidatos").
 */
export function countryRows(
  countries: readonly CountryResult[],
  finalists: readonly Finalist[],
): CountryRow[] {
  return countries
    .map((country) => {
      const votes = finalists.map((f) => country.votes[f.number] ?? 0);
      const [a = 0, b = 0] = votes;
      const leader = a === b ? undefined : finalists[a > b ? 0 : 1]?.number;
      return {
        name: country.name,
        continent: country.continent,
        votes,
        total: a + b,
        leader,
      };
    })
    .filter((row) => row.total > 0)
    .sort((x, y) => y.total - x.total || x.name.localeCompare(y.name));
}

export interface CountryStandings {
  /** Countries won (or led) by each finalist, keyed by ballot number. */
  readonly wins: Readonly<Record<string, number>>;
  /** Names of tied countries. */
  readonly ties: readonly string[];
}

export function countryStandings(
  rows: readonly CountryRow[],
  finalists: readonly Finalist[],
): CountryStandings {
  const wins: Record<string, number> = Object.fromEntries(finalists.map((f) => [f.number, 0]));
  const ties: string[] = [];
  for (const row of rows) {
    if (row.leader) wins[row.leader] = (wins[row.leader] ?? 0) + 1;
    else ties.push(row.name);
  }
  return { wins, ties };
}

/** Accent- and case-insensitive match: "japao" finds "Japão". */
export function matchesSearch(name: string, query: string): boolean {
  const normalize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLocaleLowerCase('pt-BR');
  return normalize(name).includes(normalize(query.trim()));
}
