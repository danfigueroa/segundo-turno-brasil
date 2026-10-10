/** Continents used to group votes abroad, as in the design. Oceania goes with Asia. */
export const CONTINENT_CODES = ['AM', 'EU', 'AS', 'AF'] as const;
export type ContinentCode = (typeof CONTINENT_CODES)[number];

export const CONTINENT_NAMES: Readonly<Record<ContinentCode, string>> = {
  AM: 'Américas',
  EU: 'Europa',
  AS: 'Ásia e Oceania',
  AF: 'África',
};

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
  /** Valid votes per candidate, keyed by ballot number. */
  readonly votes: Readonly<Record<string, number>>;
  readonly sections: { readonly total: number; readonly counted: number };
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
    countries.set(city.country, {
      name: city.country,
      continent: city.continent,
      votes,
      sections: {
        total: (current?.sections.total ?? 0) + city.sections.total,
        counted: (current?.sections.counted ?? 0) + city.sections.counted,
      },
    });
  }
  return [...countries.values()];
}
