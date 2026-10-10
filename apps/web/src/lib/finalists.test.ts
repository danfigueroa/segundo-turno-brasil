import { rankCandidates, type Tally } from '@stb/domain';
import { describe, expect, it } from 'vitest';
import { finalistResults, finalistsOf, leadOf, leadOfVotes } from './finalists';

function tally(votes: Record<string, number>): Tally {
  return {
    scope: { kind: 'country' },
    candidates: rankCandidates(
      Object.entries(votes).map(([number, v]) => ({
        number,
        name: `C${number}`,
        party: 'P',
        votes: v,
      })),
    ),
    sections: { total: 1, counted: 1 },
    electorate: 1,
    turnout: 1,
    votes: { valid: 1, blank: 0, null: 0 },
    updatedAt: '2026-10-25T20:00:00-03:00',
  };
}

describe('finalistsOf', () => {
  it('keeps the top two in ballot-number order with fixed hues', () => {
    const finalists = finalistsOf(tally({ '22': 60, '13': 40, '30': 5 }));
    expect(finalists.map((f) => [f.number, f.hue])).toEqual([
      ['13', 'red'],
      ['22', 'blue'],
    ]);
  });

  it('derives short names and initials for compact layouts', () => {
    const [finalist] = finalistsOf({
      ...tally({ '13': 2, '22': 1 }),
      candidates: rankCandidates([
        { number: '13', name: 'FLAVIO BOLSONARO', party: 'PL', votes: 2 },
        { number: '22', name: 'LULA', party: 'PT', votes: 1 },
      ]),
    });
    expect(finalist).toMatchObject({ shortName: 'Flávio', initials: 'FB' });
  });

  it('does not swap colors when the leader changes', () => {
    const before = finalistsOf(tally({ '22': 60, '13': 40 }));
    const after = finalistsOf(tally({ '22': 40, '13': 60 }));
    expect(after).toEqual(before);
  });
});

describe('leadOf', () => {
  const finalists = finalistsOf(tally({ '13': 1, '22': 1 }));

  it('bins the margin into intensities', () => {
    const lead = leadOf(finalistResults(tally({ '13': 44, '22': 56 }), finalists));
    expect(lead?.hue).toBe('blue');
    expect(lead?.margin).toBeCloseTo(12);
    expect(lead?.intensity).toBe(4);
  });

  it('uses the lightest step for very close races', () => {
    expect(leadOf(finalistResults(tally({ '13': 505, '22': 495 }), finalists))?.intensity).toBe(1);
  });

  it('is undefined with no votes or a perfect tie', () => {
    expect(leadOf(finalistResults(tally({ '13': 0, '22': 0 }), finalists))).toBeUndefined();
    expect(leadOf(finalistResults(tally({ '13': 5, '22': 5 }), finalists))).toBeUndefined();
  });
});

describe('leadOfVotes', () => {
  const finalists = finalistsOf(tally({ '13': 1, '22': 1 }));

  it('measures the margin against all valid votes', () => {
    const lead = leadOfVotes({ '13': 30, '22': 60, '55': 10 }, finalists);
    expect(lead?.leader.number).toBe('22');
    expect(lead?.margin).toBeCloseTo(30);
    expect(lead?.intensity).toBe(5);
  });

  it('has no leader before any vote or on a tie', () => {
    expect(leadOfVotes({}, finalists)).toBeUndefined();
    expect(leadOfVotes({ '13': 2, '22': 2 }, finalists)).toBeUndefined();
  });
});
