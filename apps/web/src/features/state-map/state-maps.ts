import type { StateCode } from '@stb/domain';

/** A state's municipalities pre-projected by `scripts/build-city-maps.ts`. */
export interface StateMapShape {
  readonly viewBox: string;
  /** SVG path of each municipality, keyed by IBGE code. */
  readonly cities: Readonly<Record<string, string>>;
}

// One lazily loaded chunk per state: only the state on screen is downloaded.
const loaders = import.meta.glob<StateMapShape>('./maps/*.generated.json', { import: 'default' });

/** Loads the municipal map of a state. */
export function loadStateMap(uf: StateCode): Promise<StateMapShape> {
  const load = loaders[`./maps/${uf.toLowerCase()}.generated.json`];
  if (!load) return Promise.reject(new Error(`No municipal map for ${uf}`));
  return load();
}

/**
 * Starts downloading a state's municipal map ahead of a likely selection (a finger down
 * on the state), so the chunk is already on its way when the click lands.
 */
export function prefetchStateMap(uf: StateCode): void {
  loadStateMap(uf).catch(() => undefined);
}
