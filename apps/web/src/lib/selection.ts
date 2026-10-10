import type { ResultsResponse } from '@stb/contracts';
import {
  aggregateRegion,
  isStateCode,
  REGION_CODES,
  REGION_NAMES,
  STATES,
  type RegionCode,
  type StateCode,
  type Tally,
} from '@stb/domain';

/** What the user is looking at. Serialized in the URL hash so it can be shared. */
export type Selection =
  | { readonly kind: 'country' }
  | { readonly kind: 'region'; readonly code: RegionCode }
  | { readonly kind: 'state'; readonly code: StateCode }
  /** Votes cast by Brazilians living abroad (TSE scope `zz`). */
  | { readonly kind: 'abroad' };

export const COUNTRY: Selection = { kind: 'country' };
export const ABROAD: Selection = { kind: 'abroad' };

export function resolveTally(data: ResultsResponse, selection: Selection): Tally {
  switch (selection.kind) {
    case 'country':
      return data.country;
    case 'region':
      return aggregateRegion(selection.code, data.states);
    case 'state':
      return data.states[selection.code];
    case 'abroad':
      return data.abroad;
  }
}

export function selectionTitle(selection: Selection): string {
  switch (selection.kind) {
    case 'country':
      return 'Brasil';
    case 'region':
      return `Região ${REGION_NAMES[selection.code]}`;
    case 'state':
      return STATES[selection.code].name;
    case 'abroad':
      return 'Exterior';
  }
}

/** `#/sp` → state, `#/regiao/ne` → region, `#/exterior` → abroad, anything else → country. */
export function parseHash(hash: string): Selection {
  const parts = hash.replace(/^#\/?/, '').toUpperCase().split('/');
  if (parts[0] === 'REGIAO' && REGION_CODES.includes(parts[1] as RegionCode)) {
    return { kind: 'region', code: parts[1] as RegionCode };
  }
  if (parts.length === 1 && parts[0] === 'EXTERIOR') return ABROAD;
  if (parts.length === 1 && parts[0] && isStateCode(parts[0])) {
    return { kind: 'state', code: parts[0] };
  }
  return COUNTRY;
}

export function toHash(selection: Selection): string {
  switch (selection.kind) {
    case 'country':
      return '';
    case 'region':
      return `#/regiao/${selection.code.toLowerCase()}`;
    case 'state':
      return `#/${selection.code.toLowerCase()}`;
    case 'abroad':
      return '#/exterior';
  }
}

export function isSameSelection(a: Selection, b: Selection): boolean {
  return toHash(a) === toHash(b);
}
