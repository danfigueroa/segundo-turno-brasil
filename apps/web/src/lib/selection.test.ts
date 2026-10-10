import { describe, expect, it } from 'vitest';
import {
  breadcrumbsOf,
  isSameSelection,
  parseSelectionPath,
  regionOf,
  resolveTally,
  selectionPath,
  selectionTitle,
  type Selection,
} from './selection';
import { citiesResponse, resultsResponse } from '../../test/fixtures';

describe('selection path', () => {
  const cases: [string, Selection][] = [
    ['', { kind: 'country' }],
    ['sp', { kind: 'state', code: 'SP' }],
    ['regiao/ne', { kind: 'region', code: 'NE' }],
    ['exterior', { kind: 'abroad' }],
    ['ba/2927408', { kind: 'city', state: 'BA', ibge: '2927408' }],
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

  it('compares selections', () => {
    expect(isSameSelection({ kind: 'state', code: 'SP' }, { kind: 'state', code: 'SP' })).toBe(
      true,
    );
    expect(isSameSelection({ kind: 'country' }, { kind: 'abroad' })).toBe(false);
  });
});

describe('selectionTitle', () => {
  it('names each kind of scope', () => {
    expect(selectionTitle({ kind: 'country' })).toBe('Brasil');
    expect(selectionTitle({ kind: 'region', code: 'CO' })).toBe('Região Centro-Oeste');
    expect(selectionTitle({ kind: 'state', code: 'PI' })).toBe('Piauí');
    expect(selectionTitle({ kind: 'abroad' })).toBe('Exterior');
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
    expect(breadcrumbsOf({ kind: 'state', code: 'BA' }).map((c) => c.label)).toEqual([
      'Brasil',
      'Nordeste',
      'Bahia',
    ]);
  });

  it('places abroad right under the country', () => {
    expect(breadcrumbsOf({ kind: 'abroad' }).map((c) => c.label)).toEqual(['Brasil', 'Exterior']);
  });

  it('walks down to a city through its state, named once loaded', () => {
    const salvador = { kind: 'city', state: 'BA', ibge: '2927408' } as const;
    expect(breadcrumbsOf(salvador).map((c) => c.label)).toEqual([
      'Brasil',
      'Nordeste',
      'Bahia',
      'Bahia',
    ]);
    const crumbs = breadcrumbsOf(salvador, citiesResponse().cities);
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
    expect(selectionTitle(salvador, citiesResponse().cities)).toBe('Salvador');
  });

  it('falls back to the state until the municipalities load', () => {
    expect(resolveTally(data, salvador)).toBe(data.states.BA);
    expect(regionOf(salvador)).toBe('NE');
  });
});
