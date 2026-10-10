import data from './world-map.generated.json';
import type { Projection } from './project';

/** World map pre-projected by `scripts/build-world-map.ts`. */
export const WORLD_MAP: {
  readonly viewBox: string;
  readonly projection: Projection;
  /** Every continent but Antarctica, as one SVG path. */
  readonly land: string;
  /** Brazil, drawn on top so it can be highlighted, with its label anchor (centroid). */
  readonly brazil: { readonly d: string; readonly label: readonly number[] };
} = data;
