import type { CountPoint } from '@stb/domain';
import type { Finalist } from '../../lib/finalists';

/** Merges recorded and live points into one curve, ordered by count, without repeats. */
export function mergePoints(...sources: readonly (readonly CountPoint[])[]): CountPoint[] {
  const sorted = sources.flat().toSorted((a, b) => a.counted - b.counted);
  return sorted.filter(
    (p, i) => p.counted > 0 && (i === 0 || p.counted > (sorted[i - 1]?.counted ?? 0)),
  );
}

export interface CurveLine {
  readonly finalist: Finalist;
  /** SVG path in a 0–100 × 0–100 box (y grows downwards). */
  readonly path: string;
  /** Share between the finalists at the last point, 0–100. */
  readonly last: number;
  /** Position of the last point in the box. */
  readonly end: { readonly x: number; readonly y: number };
}

export interface LeadChange {
  /** Counted sections when the lead changed, 0–100. */
  readonly counted: number;
  readonly x: number;
  readonly y: number;
  readonly leader: Finalist;
}

export interface Curve {
  readonly lines: readonly CurveLine[];
  /** Share range on the vertical axis, symmetric around 50%. */
  readonly yMin: number;
  readonly yMax: number;
  /** Where the 50% line sits in the box. */
  readonly middle: number;
  readonly changes: readonly LeadChange[];
}

const shareOf = (point: CountPoint, number: string, other: string) => {
  const a = point.votes[number] ?? 0;
  const b = point.votes[other] ?? 0;
  return a + b === 0 ? 50 : (a / (a + b)) * 100;
};

const countedOf = (p: CountPoint) => (p.total === 0 ? 0 : (p.counted / p.total) * 100);

/**
 * Share of each finalist (between the two) along the count, scaled to a 0–100 box.
 * The vertical range zooms in around 50% in steps of 5 points, so close races stay
 * readable. `undefined` without points or finalists.
 */
export function curveOf(
  points: readonly CountPoint[],
  finalists: readonly Finalist[],
): Curve | undefined {
  const [first, second] = finalists;
  if (!first || !second || points.length === 0) return undefined;

  const shares = points.map((p) => shareOf(p, first.number, second.number));
  const spread = Math.max(...shares.map((s) => Math.abs(s - 50)));
  const half = Math.min(50, Math.max(5, Math.ceil(spread / 5) * 5));
  const yMin = 50 - half;
  const yMax = 50 + half;
  const y = (share: number) => ((yMax - share) / (yMax - yMin)) * 100;
  const xs = points.map(countedOf);

  const lineOf = (finalist: Finalist, values: readonly number[]): CurveLine => {
    const coords = values.map((v, i) => `${(xs[i] ?? 0).toFixed(2)} ${y(v).toFixed(2)}`);
    const last = values.at(-1) ?? 50;
    return {
      finalist,
      path: `M ${coords.join(' L ')}`,
      last,
      end: { x: xs.at(-1) ?? 0, y: y(last) },
    };
  };

  const changes: LeadChange[] = [];
  let leader: string | undefined;
  shares.forEach((share, i) => {
    if (share === 50) return;
    const current = share > 50 ? first : second;
    if (leader && leader !== current.number) {
      changes.push({ counted: xs[i] ?? 0, x: xs[i] ?? 0, y: y(50), leader: current });
    }
    leader = current.number;
  });

  return {
    lines: [
      lineOf(first, shares),
      lineOf(
        second,
        shares.map((s) => 100 - s),
      ),
    ],
    yMin,
    yMax,
    middle: y(50),
    changes,
  };
}
