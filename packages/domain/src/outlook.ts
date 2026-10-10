import { lead } from './standings';
import type { CandidateResult, Tally } from './tally';

/** What the votes still to be counted can do to the race. */
export interface Outlook {
  readonly leader: CandidateResult;
  readonly runnerUp: CandidateResult;
  /** Leader's advantage over the runner-up, in votes. */
  readonly lead: number;
  /**
   * Valid votes estimated to still be counted, assuming the pending sections look like
   * the counted ones (same number of valid votes per section).
   */
  readonly remaining: number;
  /**
   * Percentage of the remaining valid votes (between the two) the runner-up needs to
   * overtake; above 100 means it can no longer happen under the estimate.
   * `undefined` when nothing is left to count.
   */
  readonly runnerUpNeeds: number | undefined;
  /**
   * True when the runner-up can no longer overtake even if every voter not yet counted
   * voted for them: a conservative bound that does not rely on the estimate.
   */
  readonly decided: boolean;
}

/** Whether the race can still turn around; `undefined` until two candidates have votes. */
export function outlook(tally: Tally): Outlook | undefined {
  const current = lead(tally);
  if (!current?.runnerUp) return undefined;
  const { leader, runnerUp } = current;
  const { total, counted } = tally.sections;

  const advantage = leader.votes - runnerUp.votes;
  const remaining =
    counted === 0 ? 0 : Math.round((tally.votes.valid * (total - counted)) / counted);
  const uncounted = Math.max(0, tally.electorate - tally.turnout);
  const finished = counted >= total;

  return {
    leader,
    runnerUp,
    lead: advantage,
    remaining,
    runnerUpNeeds: finished || remaining === 0 ? undefined : 50 + (50 * advantage) / remaining,
    decided: advantage > 0 && (finished || advantage > uncounted),
  };
}
