import type { ResultsResponse } from '@stb/contracts';
import { countedPercentage, STATE_CODES, statesInRegion, swing, type StateCode } from '@stb/domain';
import { finalistResults, leadOf, type Finalist } from '../../lib/finalists';
import { resolveTally, type Selection } from '../../lib/selection';

export interface SwingRow {
  readonly finalist: Finalist;
  /** Share of valid votes in the first round, 0–100. */
  readonly before: number;
  /** Share of valid votes in the runoff so far, 0–100. */
  readonly now: number;
  /** Change in percentage points. */
  readonly change: number;
}

export interface FlippedState {
  readonly code: StateCode;
  readonly from: Finalist;
  readonly to: Finalist;
}

export interface SwingView {
  readonly rows: readonly SwingRow[];
  /** Everyone else on the first-round ballot: the votes up for grabs in the runoff. */
  readonly others: { readonly share: number; readonly votes: number };
  /** States whose leader between the finalists changed; `undefined` for a state or abroad. */
  readonly flipped: readonly FlippedState[] | undefined;
  /** Counted sections of the runoff in the scope, 0–100. */
  readonly counted: number;
}

function flippedStates(
  first: ResultsResponse,
  runoff: ResultsResponse,
  finalists: readonly Finalist[],
  codes: readonly StateCode[],
): FlippedState[] {
  return codes.flatMap((code) => {
    const before = leadOf(finalistResults(first.states[code], finalists));
    const now = leadOf(finalistResults(runoff.states[code], finalists));
    if (!before || !now || before.leader.number === now.leader.number) return [];
    const from = finalists.find((f) => f.number === before.leader.number);
    const to = finalists.find((f) => f.number === now.leader.number);
    return from && to ? [{ code, from, to }] : [];
  });
}

/** How each finalist did in the runoff compared with the first round, in one scope. */
export function swingView(
  first: ResultsResponse,
  runoff: ResultsResponse,
  selection: Selection,
  finalists: readonly Finalist[],
): SwingView {
  const before = resolveTally(first, selection);
  const now = resolveTally(runoff, selection);
  const changes = new Map(swing(before, now).map((s) => [s.number, s.share]));
  const shareBefore = new Map(before.candidates.map((c) => [c.number, c.share]));
  const shareNow = new Map(now.candidates.map((c) => [c.number, c.share]));
  const finalistNumbers = new Set(finalists.map((f) => f.number));
  const others = before.candidates.filter((c) => !finalistNumbers.has(c.number));

  const codes =
    selection.kind === 'country'
      ? STATE_CODES
      : selection.kind === 'region'
        ? statesInRegion(selection.code)
        : undefined;

  return {
    rows: finalists.map((finalist) => ({
      finalist,
      before: shareBefore.get(finalist.number) ?? 0,
      now: shareNow.get(finalist.number) ?? 0,
      change: changes.get(finalist.number) ?? 0,
    })),
    others: {
      share: others.reduce((sum, c) => sum + c.share, 0),
      votes: others.reduce((sum, c) => sum + c.votes, 0),
    },
    flipped: codes && flippedStates(first, runoff, finalists, codes),
    counted: countedPercentage(now),
  };
}
