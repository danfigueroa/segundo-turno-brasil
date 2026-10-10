import type { ResultsResponse } from '@stb/contracts';
import {
  aggregateRegion,
  countryTally,
  isStateCode,
  municipalityTally,
  REGION_CODES,
  REGION_NAMES,
  STATES,
  type RegionCode,
  type MunicipalityResult,
  type StateCode,
  type Tally,
  type CountryResult,
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
  | { readonly kind: 'city'; readonly state: StateCode; readonly ibge: string }
  /** A country abroad, by the slug of its name ("estados-unidos"). */
  | { readonly kind: 'abroadCountry'; readonly slug: string };

/** Municipalities of the selected state, once loaded (`/api/cities`). */
export type Municipalities = readonly MunicipalityResult[] | undefined;

/** Countries abroad, once loaded (`/api/abroad`). */
export type Countries = readonly CountryResult[] | undefined;

/** URL slug of a country's name: "Estados Unidos" → "estados-unidos". */
export function countrySlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** The selection of a country abroad, by its name. */
export function abroadCountry(name: string): Selection {
  return { kind: 'abroadCountry', slug: countrySlug(name) };
}

/** The country a selection points to, once the countries abroad are loaded. */
export function countryOf(selection: Selection, countries: Countries): CountryResult | undefined {
  if (selection.kind !== 'abroadCountry') return undefined;
  return countries?.find((c) => countrySlug(c.name) === selection.slug);
}

export const COUNTRY: Selection = { kind: 'country' };
export const ABROAD: Selection = { kind: 'abroad' };

/** Whether the selection is abroad as a whole or one of its countries. */
export const isAbroad = (selection: Selection): boolean =>
  selection.kind === 'abroad' || selection.kind === 'abroadCountry';

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
 * municipalities are loaded, and a country abroad to the abroad tally until the
 * countries are.
 */
export function resolveTally(
  data: ResultsResponse,
  selection: Selection,
  cities?: Municipalities,
  countries?: Countries,
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
    case 'abroadCountry': {
      const country = countryOf(selection, countries);
      return country ? countryTally(country, data.abroad) : data.abroad;
    }
  }
}

/** "Brasil", "Região Nordeste", "Bahia", "Exterior", a city ("São Paulo") or a country abroad. */
export function selectionTitle(
  selection: Selection,
  cities?: Municipalities,
  countries?: Countries,
): string {
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
    case 'abroadCountry':
      return countryOf(selection, countries)?.name ?? 'Exterior';
  }
}

/**
 * URL path segment of a selection: `''`, `sp`, `regiao/ne`, `exterior`, `sp/3550308` or
 * `exterior/portugal`.
 */
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
    case 'abroadCountry':
      return `exterior/${selection.slug}`;
  }
}

/** Inverse of {@link selectionPath}; unknown paths fall back to the country. */
export function parseSelectionPath(path: string): Selection {
  const parts = path.toUpperCase().split('/').filter(Boolean);
  if (parts[0] === 'REGIAO' && REGION_CODES.includes(parts[1] as RegionCode)) {
    return { kind: 'region', code: parts[1] as RegionCode };
  }
  if (parts[0] === 'EXTERIOR') {
    const slug = parts[1]?.toLowerCase();
    if (parts.length === 2 && slug && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
      return { kind: 'abroadCountry', slug };
    }
    return ABROAD;
  }
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

/**
 * Path from Brazil down to the selection: Brasil › Nordeste › Bahia › Salvador, or
 * Brasil › Exterior › Portugal.
 */
export function breadcrumbsOf(
  selection: Selection,
  cities?: Municipalities,
  countries?: Countries,
): Breadcrumb[] {
  const crumbs: Breadcrumb[] = [{ label: 'Brasil', target: COUNTRY }];
  const region = regionOf(selection);
  if (region)
    crumbs.push({ label: REGION_NAMES[region], target: { kind: 'region', code: region } });
  const state = stateOf(selection);
  if (state) crumbs.push({ label: STATES[state].name, target: { kind: 'state', code: state } });
  if (selection.kind === 'city') {
    crumbs.push({ label: selectionTitle(selection, cities), target: selection });
  }
  if (selection.kind === 'abroad' || selection.kind === 'abroadCountry') {
    crumbs.push({ label: 'Exterior', target: ABROAD });
  }
  if (selection.kind === 'abroadCountry') {
    crumbs.push({ label: selectionTitle(selection, cities, countries), target: selection });
  }
  return crumbs;
}
