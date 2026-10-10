import type { CandidateResult, Tally } from '@stb/domain';
import { formatName, initialsOf } from './format';

export type CandidateHue = 'red' | 'blue';

export interface Finalist {
  readonly number: string;
  /** Display name, title-cased. */
  readonly name: string;
  /** First word of the name, for tight spots: `"Flávio"`. */
  readonly shortName: string;
  /** Avatar initials: `"FB"`. */
  readonly initials: string;
  readonly party: string;
  /** Color identity. Follows the candidate, never their rank. */
  readonly hue: CandidateHue;
}

const HUES: readonly CandidateHue[] = ['red', 'blue'];

/**
 * The two national front-runners, in a stable display order (by ballot number), so a
 * change of leadership never swaps sides or colors on screen.
 */
export function finalistsOf(country: Tally): Finalist[] {
  return country.candidates
    .slice(0, 2)
    .toSorted((a, b) => Number(a.number) - Number(b.number))
    .map((c, index) => {
      const name = formatName(c.name);
      return {
        number: c.number,
        name,
        shortName: name.split(' ')[0] ?? name,
        initials: initialsOf(name),
        party: c.party,
        hue: HUES[index] ?? 'blue',
      };
    });
}

export interface FinalistResult extends Finalist {
  readonly votes: number;
  /** Percentage of valid votes, 0–100. */
  readonly share: number;
}

/** Results of the finalists within a tally, in display order. */
export function finalistResults(tally: Tally, finalists: readonly Finalist[]): FinalistResult[] {
  const byNumber = new Map<string, CandidateResult>(tally.candidates.map((c) => [c.number, c]));
  return finalists.map((f) => ({
    ...f,
    votes: byNumber.get(f.number)?.votes ?? 0,
    share: byNumber.get(f.number)?.share ?? 0,
  }));
}

/** Margin bins in percentage points: [0,2), [2,5), [5,10), [10,20), [20,∞). */
export const MARGIN_BINS = [2, 5, 10, 20] as const;

export type Intensity = 1 | 2 | 3 | 4 | 5;

export interface StateLead {
  readonly hue: CandidateHue;
  readonly leader: FinalistResult;
  readonly margin: number;
  readonly intensity: Intensity;
}

/** Who leads among the finalists and how strongly; `undefined` when no vote is counted. */
export function leadOf(results: readonly FinalistResult[]): StateLead | undefined {
  const [a, b] = results;
  if (!a || !b || a.votes + b.votes === 0 || a.votes === b.votes) return undefined;
  const [leader, runnerUp] = a.votes > b.votes ? [a, b] : [b, a];
  const margin = leader.share - runnerUp.share;
  const intensity = (MARGIN_BINS.filter((limit) => margin >= limit).length + 1) as Intensity;
  return { hue: leader.hue, leader, margin, intensity };
}
