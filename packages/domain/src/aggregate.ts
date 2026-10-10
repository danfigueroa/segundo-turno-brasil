import { rankCandidates } from './standings';
import { statesInRegion, type RegionCode, type StateCode } from './states';
import type { CandidateResult, Scope, Tally } from './tally';

/**
 * Sums several tallies into one with the given scope (e.g. states into a region).
 * Shares are recomputed from absolute votes; `updatedAt` is the most recent input.
 */
export function aggregate(scope: Scope, tallies: readonly Tally[]): Tally {
  const byCandidate = new Map<string, Omit<CandidateResult, 'share'>>();
  for (const tally of tallies) {
    for (const c of tally.candidates) {
      const current = byCandidate.get(c.number);
      byCandidate.set(c.number, {
        number: c.number,
        name: c.name,
        party: c.party,
        votes: (current?.votes ?? 0) + c.votes,
      });
    }
  }

  const sum = (pick: (t: Tally) => number) => tallies.reduce((acc, t) => acc + pick(t), 0);

  return {
    scope,
    candidates: rankCandidates([...byCandidate.values()]),
    sections: { total: sum((t) => t.sections.total), counted: sum((t) => t.sections.counted) },
    electorate: sum((t) => t.electorate),
    turnout: sum((t) => t.turnout),
    votes: {
      valid: sum((t) => t.votes.valid),
      blank: sum((t) => t.votes.blank),
      null: sum((t) => t.votes.null),
    },
    updatedAt: tallies.map((t) => t.updatedAt).reduce((a, b) => (a > b ? a : b), ''),
  };
}

/** Builds a region tally from the tallies of its states. Missing states are skipped. */
export function aggregateRegion(
  region: RegionCode,
  states: Readonly<Partial<Record<StateCode, Tally>>>,
): Tally {
  const tallies = statesInRegion(region).flatMap((code) => states[code] ?? []);
  return aggregate({ kind: 'region', code: region }, tallies);
}
