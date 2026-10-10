import { describe, expect, it } from 'vitest';
import { finalistsOf } from '../../lib/finalists';
import { resultsResponse } from '../../../test/fixtures';
import { SHARE_PALETTE } from './palette';
import { shareContentFrom } from './share-content';

const data = resultsResponse();
const finalists = finalistsOf(data.country);

describe('shareContentFrom', () => {
  it('summarizes the national result', () => {
    const content = shareContentFrom(data, { kind: 'country' }, finalists, 'example.com');
    expect(content.title).toBe('Brasil');
    expect(content.leaderNumber).toBe('22');
    expect(content.counted).toBe(50);
    expect(content.focus.size).toBe(27);
    expect(content.siteUrl).toBe('example.com');
  });

  it('colors each state by leader and margin', () => {
    const content = shareContentFrom(data, { kind: 'country' }, finalists, 'example.com');
    // Bahia: Lula 70% x 30% and São Paulo: Flávio 60% x 40% are both 20+ p.p. margins.
    expect(content.mapFills.BA).toBe(SHARE_PALETTE.ramps.red[4]);
    expect(content.mapFills.SP).toBe(SHARE_PALETTE.ramps.blue[4]);
  });

  it('focuses on the selected region or state', () => {
    const region = shareContentFrom(data, { kind: 'region', code: 'S' }, finalists, 'x');
    expect([...region.focus].sort()).toEqual(['PR', 'RS', 'SC']);
    const state = shareContentFrom(data, { kind: 'state', code: 'BA' }, finalists, 'x');
    expect(state.title).toBe('Bahia');
    expect(state.leaderNumber).toBe('13');
    expect([...state.focus]).toEqual(['BA']);
  });
});
