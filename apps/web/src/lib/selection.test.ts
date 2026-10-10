import { describe, expect, it } from 'vitest';
import { parseHash, selectionTitle, toHash, type Selection } from './selection';

describe('selection hash', () => {
  const cases: [string, Selection][] = [
    ['', { kind: 'country' }],
    ['#/sp', { kind: 'state', code: 'SP' }],
    ['#/regiao/ne', { kind: 'region', code: 'NE' }],
  ];

  it.each(cases)('round-trips %j', (hash, selection) => {
    expect(parseHash(hash)).toEqual(selection);
    expect(toHash(selection)).toBe(hash);
  });

  it('falls back to the country for unknown hashes', () => {
    expect(parseHash('#/zz')).toEqual({ kind: 'country' });
    expect(parseHash('#/regiao/xx')).toEqual({ kind: 'country' });
  });
});

describe('selectionTitle', () => {
  it('names each kind of scope', () => {
    expect(selectionTitle({ kind: 'country' })).toBe('Brasil');
    expect(selectionTitle({ kind: 'region', code: 'CO' })).toBe('Região Centro-Oeste');
    expect(selectionTitle({ kind: 'state', code: 'PI' })).toBe('Piauí');
  });
});
