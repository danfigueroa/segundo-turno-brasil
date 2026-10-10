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

/** URL path segment of a selection: `''`, `sp`, `regiao/ne` or `exterior`. */
export function selectionPath(selection: Selection): string {
  switch (selection.kind) {
    case 'country':
      return '';
    case 'region':
      return `regiao/${selection.code.toLowerCase()}`;
    case 'state':
      return selection.code.toLowerCase();
    case 'abroad':
      return 'exterior';
  }
}

/** Inverse of {@link selectionPath}; unknown paths fall back to the country. */
export function parseSelectionPath(path: string): Selection {
  const parts = path.toUpperCase().split('/').filter(Boolean);
  if (parts[0] === 'REGIAO' && REGION_CODES.includes(parts[1] as RegionCode)) {
    return { kind: 'region', code: parts[1] as RegionCode };
  }
  if (parts.length === 1 && parts[0] === 'EXTERIOR') return ABROAD;
  if (parts.length === 1 && parts[0] && isStateCode(parts[0])) {
    return { kind: 'state', code: parts[0] };
  }
  return COUNTRY;
}

export function isSameSelection(a: Selection, b: Selection): boolean {
  return selectionPath(a) === selectionPath(b);
}

/** Region the selection belongs to: the region itself, or the state's region. */
export function regionOf(selection: Selection): RegionCode | undefined {
  if (selection.kind === 'region') return selection.code;
  if (selection.kind === 'state') return STATES[selection.code].region;
  return undefined;
}

export interface Breadcrumb {
  readonly label: string;
  readonly target: Selection;
}

/** Path from the country down to the selection: Brasil › Nordeste › Bahia. */
export function breadcrumbsOf(selection: Selection): Breadcrumb[] {
  const crumbs: Breadcrumb[] = [{ label: 'Brasil', target: COUNTRY }];
  const region = regionOf(selection);
  if (region)
    crumbs.push({ label: REGION_NAMES[region], target: { kind: 'region', code: region } });
  if (selection.kind === 'state') {
    crumbs.push({ label: STATES[selection.code].name, target: selection });
  }
  if (selection.kind === 'abroad') crumbs.push({ label: 'Exterior', target: ABROAD });
  return crumbs;
}
