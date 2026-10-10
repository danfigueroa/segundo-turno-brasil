import { STATES, type StateCode } from '@stb/domain';
import { regionOf, type Selection } from '../../lib/selection';

/** A clickable area of the map: a state or the abroad button. */
export type Area = StateCode | 'abroad';

/** How much an area stands out given the selection. */
export type Emphasis = 'full' | 'near' | 'far';

/**
 * Countries and regions keep their states in full color; a state keeps its neighbors in
 * the same region half-faded; abroad fades every state.
 */
export function emphasisOf(area: Area, selection: Selection): Emphasis {
  if (selection.kind === 'country') return 'full';
  if (area === 'abroad') return selection.kind === 'abroad' ? 'full' : 'near';
  switch (selection.kind) {
    case 'abroad':
      return 'far';
    case 'region':
      return STATES[area].region === selection.code ? 'full' : 'far';
    case 'state':
      if (selection.code === area) return 'full';
      return STATES[area].region === regionOf(selection) ? 'near' : 'far';
  }
}
