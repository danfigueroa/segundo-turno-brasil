import type { Scope, Tally } from '../src';
import { rankCandidates } from '../src';

export function makeTally(
  scope: Scope,
  votes: Record<string, number>,
  overrides: Partial<Omit<Tally, 'candidates'>> = {},
): Tally {
  const candidates = rankCandidates(
    Object.entries(votes).map(([number, v]) => ({
      number,
      name: `CANDIDATE ${number}`,
      party: `P${number}`,
      votes: v,
    })),
  );
  const valid = candidates.reduce((sum, c) => sum + c.votes, 0);
  return {
    scope,
    candidates,
    sections: { total: 100, counted: 50 },
    electorate: valid * 2,
    turnout: valid + 10,
    votes: { valid, blank: 4, null: 6 },
    updatedAt: '2026-10-25T18:00:00-03:00',
    ...overrides,
  };
}
