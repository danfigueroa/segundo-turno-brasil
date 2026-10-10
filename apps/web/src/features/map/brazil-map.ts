import type { StateCode } from '@stb/domain';
import data from './brazil-map.generated.json';

interface StateShape {
  /** SVG path, pre-projected by `scripts/build-map.ts`. */
  readonly d: string;
  /** Label anchor (centroid) in viewBox coordinates. */
  readonly label: readonly number[];
}

export const BRAZIL_MAP = data as {
  readonly viewBox: string;
  readonly states: Readonly<Record<StateCode, StateShape>>;
};
