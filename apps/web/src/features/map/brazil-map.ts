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

/**
 * Votes cast abroad have no territory: they are drawn as a tile in the Atlantic,
 * south-east of the coast (viewBox coordinates). Sized to stay a ≥ 44px touch target
 * on a 360px-wide phone.
 */
export const ABROAD_TILE = { x: 760, y: 815, width: 220, height: 145, radius: 20 } as const;
