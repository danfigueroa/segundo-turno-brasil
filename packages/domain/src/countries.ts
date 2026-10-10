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
