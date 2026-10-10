import { describe, expect, it } from 'vitest';
import {
  breadcrumbsOf,
  isSameSelection,
  parseSelectionPath,
  regionOf,
  selectionPath,
  selectionTitle,
  type Selection,
} from './selection';

describe('selection path', () => {
  const cases: [string, Selection][] = [
    ['', { kind: 'country' }],
    ['sp', { kind: 'state', code: 'SP' }],
    ['regiao/ne', { kind: 'region', code: 'NE' }],
    ['exterior', { kind: 'abroad' }],
  ];

  it.each(cases)('round-trips %j', (path, selection) => {
    expect(parseSelectionPath(path)).toEqual(selection);
    expect(selectionPath(selection)).toBe(path);
  });

  it('falls back to the country for unknown paths', () => {
    expect(parseSelectionPath('zz')).toEqual({ kind: 'country' });
    expect(parseSelectionPath('regiao/xx')).toEqual({ kind: 'country' });
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
});
