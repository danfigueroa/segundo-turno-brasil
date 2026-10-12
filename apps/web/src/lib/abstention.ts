import { countedElectorateOf, type Tally } from '@stb/domain';

/** Abstention bins in percent: [0,15), [15,20), [20,25), [25,30), [30,∞). */
export const ABSTENTION_BINS = [15, 20, 25, 30] as const;

export type AbstentionStep = 1 | 2 | 3 | 4 | 5;

/**
 * Share of the electorate of the counted sections that did not vote, 0–100; `undefined`
 * before any section is counted.
 */
export function abstentionOf(tally: Tally): number | undefined {
  const electorate = countedElectorateOf(tally);
  if (tally.sections.counted === 0 || electorate === 0) return undefined;
  return (Math.max(electorate - tally.turnout, 0) / electorate) * 100;
}

/** Map step of an abstention rate, from the lowest bin (1) to the highest (5). */
export function abstentionStep(abstention: number): AbstentionStep {
  return (ABSTENTION_BINS.filter((limit) => abstention >= limit).length + 1) as AbstentionStep;
}
