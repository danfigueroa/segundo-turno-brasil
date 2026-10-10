import type { MunicipalityResult } from '@stb/domain';
import { formatName } from './format';
import type { Finalist } from './finalists';

export interface CityRow {
  readonly ibge: string;
  /** Display name, e.g. "São Paulo". */
  readonly name: string;
  readonly electorate: number;
  /** Votes of each finalist, in display order. */
  readonly votes: readonly number[];
  /** Votes of the two finalists together. */
  readonly total: number;
  /** Ballot number of the most voted finalist; `undefined` before any vote or on a tie. */
  readonly leader: string | undefined;
}

/** Every municipality of a state, biggest electorate first. */
export function cityRows(
  cities: readonly MunicipalityResult[],
  finalists: readonly Finalist[],
): CityRow[] {
  return cities
    .map((city) => {
      const votes = finalists.map((f) => city.votes[f.number] ?? 0);
      const [a = 0, b = 0] = votes;
      return {
        ibge: city.ibge,
        name: formatName(city.name),
        electorate: city.electorate,
        votes,
        total: a + b,
        leader: a === b ? undefined : finalists[a > b ? 0 : 1]?.number,
      };
    })
    .sort((x, y) => y.electorate - x.electorate || x.name.localeCompare(y.name, 'pt-BR'));
}

/** In how many municipalities each finalist leads, keyed by ballot number. */
export function cityWins(
  rows: readonly CityRow[],
  finalists: readonly Finalist[],
): Record<string, number> {
  const wins: Record<string, number> = Object.fromEntries(finalists.map((f) => [f.number, 0]));
  for (const row of rows) {
    if (row.leader) wins[row.leader] = (wins[row.leader] ?? 0) + 1;
  }
  return wins;
}
