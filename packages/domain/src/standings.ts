import type { CandidateResult, Tally } from './tally';

/** Percentage of polling sections already counted, 0–100. */
export function countedPercentage(tally: Tally): number {
  const { total, counted } = tally.sections;
  return total === 0 ? 0 : (counted / total) * 100;
}

/** Share of each candidate over the sum of their votes, sorted descending. */
export function rankCandidates(
  candidates: readonly Omit<CandidateResult, 'share'>[],
): CandidateResult[] {
  const valid = candidates.reduce((sum, c) => sum + c.votes, 0);
  return candidates
    .map((c) => ({ ...c, share: valid === 0 ? 0 : (c.votes / valid) * 100 }))
    .sort((a, b) => b.votes - a.votes || a.number.localeCompare(b.number));
}

export interface Lead {
  readonly leader: CandidateResult;
  readonly runnerUp: CandidateResult | undefined;
  /** Difference in percentage points between leader and runner-up. */
  readonly margin: number;
}

/** Who is ahead and by how much; `undefined` while no vote was counted. */
export function lead(tally: Tally): Lead | undefined {
  const [leader, runnerUp] = tally.candidates;
  if (!leader || leader.votes === 0) return undefined;
  return { leader, runnerUp, margin: leader.share - (runnerUp?.share ?? 0) };
}
