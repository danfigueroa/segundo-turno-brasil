import { rankCandidates } from '@stb/domain';
import { describe, expect, it } from 'vitest';
import { resultsResponse, tally } from '../../../test/fixtures';
import { finalistsOf } from '../../lib/finalists';
import { swingView } from './swing-view';

const runoff = resultsResponse();
const finalists = finalistsOf(runoff.country);

/** First round: same finalists plus a third candidate with 100 votes everywhere. */
function firstRound() {
  const withThird = (t: ReturnType<typeof tally>) => ({
    ...t,
    candidates: rankCandidates([
      ...t.candidates,
      { number: '15', name: 'TERCEIRO', party: 'P15', votes: 100 },
    ]),
  });
  const base = resultsResponse({ round: 1 });
  return {
    ...base,
    country: withThird(tally({ kind: 'country' }, 9_000, 10_000, 100)),
    // Bahia led by Flávio in the first round, Lula in the runoff fixture.
    states: { ...base.states, BA: withThird(tally({ kind: 'state', code: 'BA' }, 300, 600, 100)) },
  };
}

describe('swingView', () => {
  const view = swingView(firstRound(), runoff, { kind: 'country' }, finalists);

  it('compares each finalist’s share with the first round', () => {
    const [lula, flavio] = view.rows;
    expect(lula?.before).toBeCloseTo((9_000 / 19_100) * 100);
    expect(lula?.now).toBeCloseTo((12_000 / 24_400) * 100);
    expect(lula?.change).toBeCloseTo((lula?.now ?? 0) - (lula?.before ?? 0));
    expect(flavio?.finalist.shortName).toBe('Flávio');
  });

  it('sums the first-round votes of everyone else', () => {
    expect(view.others.votes).toBe(100);
    expect(view.others.share).toBeCloseTo((100 / 19_100) * 100);
  });

  it('lists states whose leader changed', () => {
    expect(view.flipped).toEqual([{ code: 'BA', from: finalists[1], to: finalists[0] }]);
    expect(view.counted).toBe(50);
  });

  it('has no state list for a single state', () => {
    expect(
      swingView(firstRound(), runoff, { kind: 'state', code: 'BA' }, finalists).flipped,
    ).toBeUndefined();
  });
});
