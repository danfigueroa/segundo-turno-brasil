import type { Tally } from './tally';

/** How a candidate's result changed between two tallies of the same scope. */
export interface CandidateSwing {
  readonly number: string;
  /** Change in share of valid votes, in percentage points. */
  readonly share: number;
  /** Change in absolute votes. */
  readonly votes: number;
}

/**
 * Change of each candidate of `after` relative to `before` (e.g. first round → runoff).
 * A candidate missing from `before` is compared against zero.
 */
export function swing(before: Tally, after: Tally): CandidateSwing[] {
  const previous = new Map(before.candidates.map((c) => [c.number, c]));
  return after.candidates.map((c) => ({
    number: c.number,
    share: c.share - (previous.get(c.number)?.share ?? 0),
    votes: c.votes - (previous.get(c.number)?.votes ?? 0),
  }));
}
