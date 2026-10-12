import type { ResultsResponse } from '@stb/contracts';
import { countedPercentage, STATE_CODES, statesInRegion, type StateCode } from '@stb/domain';
import { finalistResults, leadOf, type Finalist } from '../../lib/finalists';
import { resolveTally, type Selection } from '../../lib/selection';
import RUNOFF_2022 from './data/runoff-2022.generated.json';

/** Votes of ballot numbers 13 and 22 in the 2022 runoff (`scripts/build-2022.ts`). */
type Votes2022 = Readonly<Record<'13' | '22', number>>;

export interface Compare2022Row {
  readonly finalist: Finalist;
  /** Who had this ballot number in 2022: "Jair Bolsonaro". */
  readonly name2022: string;
  /** Share of the two finalists' votes in the 2022 runoff, 0–100. */
  readonly before: number;
  /** Share of valid votes now, 0–100. */
  readonly now: number;
  /** Change in percentage points. */
  readonly change: number;
}

/** A state now led by the other ballot number than in 2022. */
export interface Flipped2022 {
  readonly code: StateCode;
  /** Who led in 2022: "Jair" or "Lula", in the hue of that ballot number today. */
  readonly from: { readonly shortName: string; readonly hue: Finalist['hue'] };
  readonly to: Finalist;
}

export interface Compare2022View {
  readonly rows: readonly Compare2022Row[];
  /**
   * Brazil only, while the count goes on: each ballot number's share in 2022 when the same
   * percentage of sections had been counted, a fairer comparison than the final result.
   */
  readonly atSameCount:
    { readonly counted: number; readonly shares: readonly number[] } | undefined;
  /** States led by another ballot number than in 2022; `undefined` for a state or abroad. */
  readonly flipped: readonly Flipped2022[] | undefined;
  /** Counted sections of the runoff in the scope, 0–100. */
  readonly counted: number;
}

const states2022 = RUNOFF_2022.states as Readonly<Record<StateCode, Votes2022>>;

const sumVotes = (codes: readonly StateCode[]): Votes2022 =>
  codes.reduce(
    (sum, code) => ({
      '13': sum['13'] + states2022[code]['13'],
      '22': sum['22'] + states2022[code]['22'],
    }),
    { '13': 0, '22': 0 },
  );

function votes2022Of(selection: Selection): Votes2022 | undefined {
  switch (selection.kind) {
    case 'country':
      return RUNOFF_2022.country;
    case 'abroad':
      return RUNOFF_2022.abroad;
    case 'state':
      return states2022[selection.code];
    case 'region':
      return sumVotes(statesInRegion(selection.code));
    // No 2022 data per municipality or country abroad.
    case 'city':
    case 'abroadCountry':
      return undefined;
  }
}

const shareOf = (votes: Votes2022, number: string) => {
  const total = votes['13'] + votes['22'];
  const own = number === '13' ? votes['13'] : number === '22' ? votes['22'] : 0;
  return total === 0 ? 0 : (own / total) * 100;
};

const leaderOf = (votes: Votes2022) => (votes['13'] >= votes['22'] ? '13' : '22');

/**
 * The runoff against 2022 (Lula × Jair Bolsonaro), by ballot number: 13 and 22 are the
 * same parties' numbers in both years. `undefined` for scopes without 2022 data.
 */
export function compare2022View(
  runoff: ResultsResponse,
  selection: Selection,
  finalists: readonly Finalist[],
): Compare2022View | undefined {
  const before = votes2022Of(selection);
  // The comparison only makes sense between the same two ballot numbers.
  if (!before || !finalists.every((f) => f.number === '13' || f.number === '22')) return undefined;
  const now = resolveTally(runoff, selection);
  const results = finalistResults(now, finalists);
  const counted = countedPercentage(now);
  const names: Readonly<Record<string, string>> = RUNOFF_2022.names;

  const percent = Math.floor(counted);
  const point = RUNOFF_2022.curve.find(([at]) => at === percent);
  const atSameCount =
    selection.kind === 'country' && counted < 100 && point
      ? {
          counted: percent,
          shares: finalists.map((f) =>
            shareOf({ '13': point[1] ?? 0, '22': point[2] ?? 0 }, f.number),
          ),
        }
      : undefined;

  const codes =
    selection.kind === 'country'
      ? STATE_CODES
      : selection.kind === 'region'
        ? statesInRegion(selection.code)
        : undefined;
  const flipped = codes?.flatMap((code) => {
    const lead = leadOf(finalistResults(runoff.states[code], finalists));
    const was = leaderOf(states2022[code]);
    if (!lead || lead.leader.number === was) return [];
    const previous = finalists.find((f) => f.number === was);
    const to = finalists.find((f) => f.number === lead.leader.number);
    if (!previous || !to) return [];
    const shortName = names[was]?.split(' ')[0] ?? previous.shortName;
    return [{ code, from: { shortName, hue: previous.hue }, to }];
  });

  return {
    rows: results.map((result) => {
      const share2022 = shareOf(before, result.number);
      return {
        finalist: result,
        name2022: names[result.number] ?? result.name,
        before: share2022,
        now: result.share,
        change: result.share - share2022,
      };
    }),
    atSameCount,
    flipped,
    counted,
  };
}
