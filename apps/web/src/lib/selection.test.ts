import { describe, expect, it } from 'vitest';
import {
  abroadCountry,
  breadcrumbsOf,
  countrySlug,
  isSameSelection,
  parseSelectionPath,
  regionOf,
  resolveTally,
  selectionPath,
  selectionTitle,
  type Selection,
} from './selection';
import { DEFAULT_I18N as pt } from '../i18n/i18n';
import { loadI18n } from '../i18n/load';
import { abroadResponse, citiesResponse, resultsResponse } from '../../test/fixtures';

describe('selection path', () => {
  const cases: [string, Selection][] = [
    ['', { kind: 'country' }],
    ['sp', { kind: 'state', code: 'SP' }],
    ['regiao/ne', { kind: 'region', code: 'NE' }],
    ['exterior', { kind: 'abroad' }],
    ['ba/2927408', { kind: 'city', state: 'BA', ibge: '2927408' }],
    ['exterior/estados-unidos', { kind: 'abroadCountry', slug: 'estados-unidos' }],
  ];

  it.each(cases)('round-trips %j', (path, selection) => {
    expect(parseSelectionPath(path)).toEqual(selection);
    expect(selectionPath(selection)).toBe(path);
  });

  it('falls back to the country for unknown paths', () => {
    expect(parseSelectionPath('zz')).toEqual({ kind: 'country' });
    expect(parseSelectionPath('regiao/xx')).toEqual({ kind: 'country' });
  });

  it('keeps the state when the city code is malformed or from another state', () => {
    expect(parseSelectionPath('ba/123')).toEqual({ kind: 'state', code: 'BA' });
    expect(parseSelectionPath('ba/3550308')).toEqual({ kind: 'state', code: 'BA' });
    expect(parseSelectionPath('ba/2927408/x')).toEqual({ kind: 'country' });
  });

  it('falls back to abroad for a malformed country', () => {
    expect(parseSelectionPath('exterior/Japão')).toEqual({ kind: 'abroad' });
    expect(parseSelectionPath('exterior/japao/x')).toEqual({ kind: 'abroad' });
  });

  it('compares selections', () => {
    expect(isSameSelection({ kind: 'state', code: 'SP' }, { kind: 'state', code: 'SP' })).toBe(
      true,
    );
    expect(isSameSelection({ kind: 'country' }, { kind: 'abroad' })).toBe(false);
  });
});

describe('selectionTitle', () => {
  it('names each kind of scope', () => {
    expect(selectionTitle({ kind: 'country' }, pt)).toBe('Brasil');
    expect(selectionTitle({ kind: 'region', code: 'CO' }, pt)).toBe('Região Centro-Oeste');
    expect(selectionTitle({ kind: 'state', code: 'PI' }, pt)).toBe('Piauí');
    expect(selectionTitle({ kind: 'abroad' }, pt)).toBe('Outros países');
  });

  it('speaks the language on screen', async () => {
    const en = await loadI18n('en');
    expect(selectionTitle({ kind: 'region', code: 'NE' }, en)).toBe('Northeast region');
    expect(selectionTitle({ kind: 'state', code: 'PI' }, en)).toBe('Piauí');
    const countries = abroadResponse().countries;
    expect(selectionTitle(abroadCountry('Estados Unidos'), en, undefined, countries)).toBe(
      'United States',
    );
  });
});

describe('regionOf', () => {
  it('resolves the region of regions and states only', () => {
    expect(regionOf({ kind: 'region', code: 'S' })).toBe('S');
    expect(regionOf({ kind: 'state', code: 'BA' })).toBe('NE');
    expect(regionOf({ kind: 'country' })).toBeUndefined();
    expect(regionOf({ kind: 'abroad' })).toBeUndefined();
  });
});

describe('breadcrumbsOf', () => {
  it('walks from the country down to a state', () => {
    expect(breadcrumbsOf({ kind: 'state', code: 'BA' }, pt).map((c) => c.label)).toEqual([
      'Brasil',
      'Nordeste',
      'Bahia',
    ]);
  });

  it('places abroad right under the country', () => {
    expect(breadcrumbsOf({ kind: 'abroad' }, pt).map((c) => c.label)).toEqual([
      'Brasil',
      'Outros países',
    ]);
  });

  it('walks down to a city through its state, named once loaded', () => {
    const salvador = { kind: 'city', state: 'BA', ibge: '2927408' } as const;
    expect(breadcrumbsOf(salvador, pt).map((c) => c.label)).toEqual([
      'Brasil',
      'Nordeste',
      'Bahia',
      'Bahia',
    ]);
    const crumbs = breadcrumbsOf(salvador, pt, citiesResponse().cities);
    expect(crumbs.map((c) => c.label)).toEqual(['Brasil', 'Nordeste', 'Bahia', 'Salvador']);
    expect(crumbs[2]?.target).toEqual({ kind: 'state', code: 'BA' });
  });
});

describe('resolveTally for a city', () => {
  const data = resultsResponse();
  const salvador = { kind: 'city', state: 'BA', ibge: '2927408' } as const;

  it("uses the city's votes with the state's candidates", () => {
    const tally = resolveTally(data, salvador, citiesResponse().cities);
    expect(tally.candidates.map((c) => [c.name, c.votes, c.share])).toEqual([
      ['LULA', 700, 70],
      ['FLAVIO BOLSONARO', 300, 30],
    ]);
    expect(selectionTitle(salvador, pt, citiesResponse().cities)).toBe('Salvador');
  });

  it('falls back to the state until the municipalities load', () => {
    expect(resolveTally(data, salvador)).toBe(data.states.BA);
    expect(regionOf(salvador)).toBe('NE');
  });
});

describe('a country abroad', () => {
  const data = resultsResponse();
  const { countries } = abroadResponse();
  const portugal = abroadCountry('Portugal');

  it('is named in the URL by a slug of its name, without accents', () => {
    expect(countrySlug('Estados Unidos')).toBe('estados-unidos');
    expect(countrySlug('Japão')).toBe('japao');
    expect(countrySlug('Guiné-Bissau')).toBe('guine-bissau');
    expect(abroadCountry('República Tcheca')).toEqual({
      kind: 'abroadCountry',
      slug: 'republica-tcheca',
    });
  });

  it("uses the country's votes and voters with the abroad candidates", () => {
    const tally = resolveTally(data, portugal, undefined, countries);
    expect(tally.candidates.map((c) => [c.number, c.votes])).toEqual([
      ['13', 6],
      ['22', 3],
    ]);
    expect(tally.electorate).toBe(2000);
    expect(tally.votes).toEqual({ valid: 9, blank: 1, null: 1 });
    expect(selectionTitle(portugal, pt, undefined, countries)).toBe('Portugal');
  });

  it('falls back to abroad until the countries load', () => {
    expect(resolveTally(data, portugal)).toBe(data.abroad);
    expect(selectionTitle(portugal, pt)).toBe('Outros países');
  });

  it('walks down from Brazil through abroad', () => {
    expect(breadcrumbsOf(portugal, pt, undefined, countries).map((c) => c.label)).toEqual([
      'Brasil',
      'Outros países',
      'Portugal',
    ]);
    expect(regionOf(portugal)).toBeUndefined();
  });
});
