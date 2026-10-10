import type { ContinentCode } from '@stb/domain';

/** One country on a continent map, as written by `scripts/build-world-map.ts`. */
export interface CountryShape {
  readonly d: string;
  /** Name as the TSE writes it (`CountryResult.name`); only countries with polling stations. */
  readonly name?: string;
  /** Brazil, drawn darker as a landmark. */
  readonly brazil?: true;
  /** Where the name goes (the centroid). */
  readonly label?: readonly number[];
  /** Too small to see: it also gets a marker. */
  readonly tiny?: true;
}

/** A continent pre-projected by `scripts/build-world-map.ts`. */
export interface ContinentMapShape {
  readonly viewBox: string;
  readonly countries: readonly CountryShape[];
}

// One lazily loaded chunk per continent: only the continent on screen is downloaded.
const loaders = import.meta.glob<ContinentMapShape>('./maps/*.generated.json', {
  import: 'default',
});

/** Loads the map of a continent. */
export function loadContinentMap(continent: ContinentCode): Promise<ContinentMapShape> {
  const load = loaders[`./maps/${continent.toLowerCase()}.generated.json`];
  if (!load) return Promise.reject(new Error(`No map for ${continent}`));
  return load();
}
