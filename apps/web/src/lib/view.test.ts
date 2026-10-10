import { describe, expect, it } from 'vitest';
import { resultsResponse, tally } from '../../test/fixtures';
import { parseHash, resolveRound, toHash, type View } from './view';

describe('view hash', () => {
  const cases: [string, View][] = [
    ['', { round: undefined, selection: { kind: 'country' } }],
    ['#/sp', { round: undefined, selection: { kind: 'state', code: 'SP' } }],
    ['#/regiao/ne', { round: undefined, selection: { kind: 'region', code: 'NE' } }],
    ['#/exterior', { round: undefined, selection: { kind: 'abroad' } }],
    ['#/1turno', { round: 1, selection: { kind: 'country' } }],
    ['#/1turno/sp', { round: 1, selection: { kind: 'state', code: 'SP' } }],
    ['#/2turno/regiao/s', { round: 2, selection: { kind: 'region', code: 'S' } }],
  ];

  it.each(cases)('round-trips %j', (hash, view) => {
    expect(parseHash(hash)).toEqual(view);
    expect(toHash(view)).toBe(hash);
  });

  it('falls back to the country for unknown paths', () => {
    expect(parseHash('#/zz').selection).toEqual({ kind: 'country' });
    expect(parseHash('#/1turno/regiao/xx')).toEqual({ round: 1, selection: { kind: 'country' } });
  });
});

describe('resolveRound', () => {
  const notStarted = resultsResponse({ country: tally({ kind: 'country' }, 0, 0, 0) });

  it('honors the round in the URL', () => {
    expect(resolveRound(2, notStarted)).toBe(2);
    expect(resolveRound(1, resultsResponse())).toBe(1);
  });

  it('shows the first round until the runoff count starts', () => {
    expect(resolveRound(undefined, notStarted)).toBe(1);
    expect(resolveRound(undefined, undefined)).toBe(1);
  });

  it('switches to the runoff once counting starts', () => {
    expect(resolveRound(undefined, resultsResponse())).toBe(2);
  });
});
