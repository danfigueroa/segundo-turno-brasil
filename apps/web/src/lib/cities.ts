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
  /** Leader's advantage over the other finalist, in points of their votes together. */
  readonly margin: number;
  /** Polling sections still to be counted. */
  readonly pending: number;
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
        margin: a + b === 0 ? 0 : (Math.abs(a - b) / (a + b)) * 100,
        pending: Math.max(0, city.sections.total - city.sections.counted),
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

/** Ways to rank a state's municipalities. */
export type CityOrder = 'electorate' | 'margin' | 'pending';

const byName = (x: CityRow, y: CityRow) => x.name.localeCompare(y.name, 'pt-BR');

/**
 * Municipalities by biggest electorate, by widest lead (where a finalist is strongest)
 * or by most sections still to count (where the count can still move the result).
 */
export function sortCityRows(rows: readonly CityRow[], order: CityOrder): CityRow[] {
  switch (order) {
    case 'electorate':
      return rows.toSorted((x, y) => y.electorate - x.electorate || byName(x, y));
    case 'margin':
      return rows.toSorted((x, y) => y.margin - x.margin || y.electorate - x.electorate);
    case 'pending':
      return rows.toSorted((x, y) => y.pending - x.pending || y.electorate - x.electorate);
  }
}
