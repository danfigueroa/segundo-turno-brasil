import { rankCandidates } from './standings';
import type { Tally } from './tally';

/** Continents used to group votes abroad, as in the design. Oceania goes with Asia. */
export const CONTINENT_CODES = ['AM', 'EU', 'AS', 'AF'] as const;
export type ContinentCode = (typeof CONTINENT_CODES)[number];

export const CONTINENT_NAMES: Readonly<Record<ContinentCode, string>> = {
  AM: 'Américas',
  EU: 'Europa',
  AS: 'Ásia e Oceania',
  AF: 'África',
};

/** Valid, blank and null votes. */
export interface Ballots {
  readonly valid: number;
  readonly blank: number;
  readonly null: number;
}

/**
 * Votes cast in one country abroad. The TSE counts abroad votes by city; a country is
 * the sum of its cities.
 */
export interface CountryResult {
  /** Country name in Portuguese, e.g. "Estados Unidos". */
  readonly name: string;
  readonly continent: ContinentCode;
  /** Valid votes per candidate, keyed by ballot number. */
  readonly votes: Readonly<Record<string, number>>;
  readonly sections: { readonly total: number; readonly counted: number };
  /** Registered voters. */
  readonly electorate: number;
  /** Voters who showed up. */
  readonly turnout: number;
  readonly ballots: Ballots;
  /** ISO 8601 timestamp of the latest TSE totalization among its cities. */
  readonly updatedAt: string;
}

/** One city abroad with polling stations: where it is and how it voted. */
export interface AbroadCityResult {
  /** TSE city code, e.g. "29254". */
  readonly code: string;
  /** City name as the TSE publishes it (uppercase Portuguese), e.g. "NOVA YORK". */
  readonly name: string;
  /** Country name in Portuguese, as in {@link CountryResult}. */
  readonly country: string;
  readonly continent: ContinentCode;
  /** Latitude and longitude in degrees (one decimal is plenty for a world map). */
  readonly lat: number;
  readonly lon: number;
  /** Registered voters. */
  readonly electorate: number;
  /** Voters who showed up. */
  readonly turnout: number;
  /** Valid votes per candidate, keyed by ballot number. */
  readonly votes: Readonly<Record<string, number>>;
  readonly ballots: Ballots;
  readonly sections: { readonly total: number; readonly counted: number };
  /** ISO 8601 timestamp of the city's last TSE totalization. */
  readonly updatedAt: string;
}

/** Votes abroad at both levels the site shows: countries (list) and cities (world map). */
export interface AbroadBreakdown {
  readonly countries: readonly CountryResult[];
  readonly cities: readonly AbroadCityResult[];
}

/** Adds the cities abroad of each country together, keeping the order of first appearance. */
export function aggregateCountries(cities: readonly AbroadCityResult[]): CountryResult[] {
  const countries = new Map<string, CountryResult>();
  for (const city of cities) {
    const current = countries.get(city.country);
    const votes: Record<string, number> = { ...current?.votes };
    for (const [number, count] of Object.entries(city.votes)) {
      votes[number] = (votes[number] ?? 0) + count;
    }
    const add = (pick: (r: CountryResult | AbroadCityResult) => number) =>
      (current ? pick(current) : 0) + pick(city);
    countries.set(city.country, {
      name: city.country,
      continent: city.continent,
      votes,
      sections: { total: add((r) => r.sections.total), counted: add((r) => r.sections.counted) },
      electorate: add((r) => r.electorate),
      turnout: add((r) => r.turnout),
      ballots: {
        valid: add((r) => r.ballots.valid),
        blank: add((r) => r.ballots.blank),
        null: add((r) => r.ballots.null),
      },
      updatedAt: current && current.updatedAt > city.updatedAt ? current.updatedAt : city.updatedAt,
    });
  }
  return [...countries.values()];
}

/**
 * A country abroad as a full tally, so it can be shown like any other scope. Candidates
 * keep the names and parties of the abroad tally; shares are of the country's valid
 * votes. There is no country scope kind: the tally keeps abroad as its scope.
 */
export function countryTally(country: CountryResult, abroad: Tally): Tally {
  return {
    scope: abroad.scope,
    candidates: rankCandidates(
      abroad.candidates.map(({ number, name, party }) => ({
        number,
        name,
        party,
        votes: country.votes[number] ?? 0,
      })),
    ),
    sections: country.sections,
    electorate: country.electorate,
    turnout: country.turnout,
    votes: country.ballots,
    updatedAt: country.updatedAt,
  };
}
