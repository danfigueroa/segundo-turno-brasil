import { describe, expect, it } from 'vitest';
import { countedPercentage, lead, rankCandidates } from '../src';
import { makeTally } from './factories';

describe('rankCandidates', () => {
  it('sorts by votes and computes the share of valid votes', () => {
    const ranked = rankCandidates([
      { number: '13', name: 'A', party: 'PA', votes: 25 },
      { number: '22', name: 'B', party: 'PB', votes: 75 },
    ]);
    expect(ranked.map((c) => [c.number, c.share])).toEqual([
      ['22', 75],
      ['13', 25],
    ]);
  });

  it('returns zero shares when nobody has votes', () => {
    const ranked = rankCandidates([{ number: '13', name: 'A', party: 'PA', votes: 0 }]);
    expect(ranked[0]?.share).toBe(0);
  });

  it('breaks ties deterministically by ballot number', () => {
    const ranked = rankCandidates([
      { number: '22', name: 'B', party: 'PB', votes: 10 },
      { number: '13', name: 'A', party: 'PA', votes: 10 },
    ]);
    expect(ranked.map((c) => c.number)).toEqual(['13', '22']);
  });
});

describe('lead', () => {
  it('reports the leader and the margin in percentage points', () => {
    const result = lead(makeTally({ kind: 'country' }, { '13': 40, '22': 60 }));
    expect(result?.leader.number).toBe('22');
    expect(result?.runnerUp?.number).toBe('13');
    expect(result?.margin).toBeCloseTo(20);
  });

  it('is undefined before any vote is counted', () => {
    expect(lead(makeTally({ kind: 'country' }, { '13': 0, '22': 0 }))).toBeUndefined();
  });
});

describe('countedPercentage', () => {
  it('divides counted by total sections', () => {
    const tally = makeTally({ kind: 'country' }, { '13': 1 }, { sections: { total: 8, counted: 2 } });
    expect(countedPercentage(tally)).toBe(25);
  });

  it('handles scopes without sections', () => {
    const tally = makeTally({ kind: 'country' }, { '13': 1 }, { sections: { total: 0, counted: 0 } });
    expect(countedPercentage(tally)).toBe(0);
  });
});
