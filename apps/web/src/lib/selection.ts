import type { ResultsResponse } from '@stb/contracts';
import {
  aggregateRegion,
  isStateCode,
  municipalityTally,
  REGION_CODES,
  REGION_NAMES,
  STATES,
  type RegionCode,
  type MunicipalityResult,
  type StateCode,
  type Tally,
} from '@stb/domain';
import { formatName } from './format';

/** What the user is looking at. Serialized in the URL hash so it can be shared. */
export type Selection =
  | { readonly kind: 'country' }
  | { readonly kind: 'region'; readonly code: RegionCode }
  | { readonly kind: 'state'; readonly code: StateCode }
  /** Votes cast by Brazilians living abroad (TSE scope `zz`). */
  | { readonly kind: 'abroad' }
  /** A municipality, by IBGE code, within its state. */
  | { readonly kind: 'city'; readonly state: StateCode; readonly ibge: string };

/** Municipalities of the selected state, once loaded (`/api/cities`). */
export type Municipalities = readonly MunicipalityResult[] | undefined;

export const COUNTRY: Selection = { kind: 'country' };
export const ABROAD: Selection = { kind: 'abroad' };

/** The municipality a city selection points to, once the state's municipalities are loaded. */
export function municipalityOf(
  selection: Selection,
  cities: Municipalities,
): MunicipalityResult | undefined {
  if (selection.kind !== 'city') return undefined;
  return cities?.find((c) => c.ibge === selection.ibge);
}

/** State of a state or city selection. */
export function stateOf(selection: Selection): StateCode | undefined {
  if (selection.kind === 'state') return selection.code;
  if (selection.kind === 'city') return selection.state;
  return undefined;
}

/**
 * The tally of a selection. A city falls back to its state's tally until the
 * municipalities are loaded.
 */
export function resolveTally(
  data: ResultsResponse,
  selection: Selection,
  cities?: Municipalities,
): Tally {
  switch (selection.kind) {
    case 'country':
      return data.country;
    case 'region':
      return aggregateRegion(selection.code, data.states);
    case 'state':
      return data.states[selection.code];
    case 'abroad':
      return data.abroad;
    case 'city': {
      const state = data.states[selection.state];
      const municipality = municipalityOf(selection, cities);
      return municipality ? municipalityTally(municipality, state) : state;
    }
  }
}

/** "Brasil", "Região Nordeste", "Bahia", "Exterior" or the city's name ("São Paulo"). */
export function selectionTitle(selection: Selection, cities?: Municipalities): string {
  switch (selection.kind) {
    case 'country':
      return 'Brasil';
    case 'region':
      return `Região ${REGION_NAMES[selection.code]}`;
    case 'state':
      return STATES[selection.code].name;
    case 'abroad':
      return 'Exterior';
    case 'city': {
      const municipality = municipalityOf(selection, cities);
      return municipality ? formatName(municipality.name) : STATES[selection.state].name;
    }
  }
}

/** URL path segment of a selection: `''`, `sp`, `regiao/ne`, `exterior` or `sp/3550308`. */
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
    case 'city':
      return `${selection.state.toLowerCase()}/${selection.ibge}`;
  }
}

/** Inverse of {@link selectionPath}; unknown paths fall back to the country. */
export function parseSelectionPath(path: string): Selection {
  const parts = path.toUpperCase().split('/').filter(Boolean);
  if (parts[0] === 'REGIAO' && REGION_CODES.includes(parts[1] as RegionCode)) {
    return { kind: 'region', code: parts[1] as RegionCode };
  }
  if (parts.length === 1 && parts[0] === 'EXTERIOR') return ABROAD;
  const [state, ibge] = parts;
  if (!state || !isStateCode(state) || parts.length > 2) return COUNTRY;
  if (ibge === undefined) return { kind: 'state', code: state };
  // IBGE codes start with the state's code: 35… is São Paulo.
  if (/^\d{7}$/.test(ibge) && ibge.startsWith(STATES[state].ibgeCode)) {
    return { kind: 'city', state, ibge };
  }
  return { kind: 'state', code: state };
}

export function isSameSelection(a: Selection, b: Selection): boolean {
  return selectionPath(a) === selectionPath(b);
}

/** Region the selection belongs to: the region itself, or the state's (or city's) region. */
export function regionOf(selection: Selection): RegionCode | undefined {
  if (selection.kind === 'region') return selection.code;
  const state = stateOf(selection);
  return state ? STATES[state].region : undefined;
}

export interface Breadcrumb {
  readonly label: string;
  readonly target: Selection;
}

/** Path from the country down to the selection: Brasil › Nordeste › Bahia › Salvador. */
export function breadcrumbsOf(selection: Selection, cities?: Municipalities): Breadcrumb[] {
  const crumbs: Breadcrumb[] = [{ label: 'Brasil', target: COUNTRY }];
  const region = regionOf(selection);
  if (region)
    crumbs.push({ label: REGION_NAMES[region], target: { kind: 'region', code: region } });
  const state = stateOf(selection);
  if (state) crumbs.push({ label: STATES[state].name, target: { kind: 'state', code: state } });
  if (selection.kind === 'city') {
    crumbs.push({ label: selectionTitle(selection, cities), target: selection });
  }
  if (selection.kind === 'abroad') crumbs.push({ label: 'Exterior', target: ABROAD });
  return crumbs;
}
