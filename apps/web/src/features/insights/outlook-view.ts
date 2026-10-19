import { outlook, type Tally } from '@stb/domain';
import type { Finalist } from '../../lib/finalists';
import type { I18n } from '../../i18n/i18n';

export interface OutlookView {
  readonly decided: boolean;
  /** Short status for the pill: "Decidido" or "Em aberto". */
  readonly status: string;
  readonly headline: string;
  readonly sentence: string;
  readonly leader: Finalist;
  readonly runnerUp: Finalist;
  /** Leader's advantage, in votes. */
  readonly lead: number;
  /** Valid votes estimated to still be counted. */
  readonly remaining: number;
  /** Share of the remaining votes the runner-up needs, 0–100 (capped); `undefined` if decided. */
  readonly needs: number | undefined;
}

/**
 * "Can it still turn around?" for a live tally. `undefined` once the count is over or
 * while the finalists have no votes.
 */
export function outlookView(
  tally: Tally,
  finalists: readonly Finalist[],
  { m, f }: I18n,
): OutlookView | undefined {
  if (tally.sections.counted >= tally.sections.total) return undefined;
  const result = outlook(tally);
  const leader = finalists.find((f) => f.number === result?.leader.number);
  const runnerUp = finalists.find((f) => f.number === result?.runnerUp.number);
  if (!result || !leader || !runnerUp || result.lead === 0) return undefined;

  const needs = result.runnerUpNeeds;
  const base = { leader, runnerUp, lead: result.lead, remaining: result.remaining };
  if (result.decided) {
    return {
      ...base,
      decided: true,
      status: m.insights.decided,
      headline: m.insights.decidedHeadline,
      sentence: m.insights.decidedSentence(runnerUp.shortName, leader.shortName),
      needs: undefined,
    };
  }
  if (needs === undefined || needs > 100) {
    return {
      ...base,
      decided: false,
      status: m.insights.open,
      headline: m.insights.unlikelyHeadline,
      sentence: m.insights.unlikelySentence(runnerUp.shortName),
      needs: 100,
    };
  }
  return {
    ...base,
    decided: false,
    status: m.insights.open,
    headline: m.insights.possibleHeadline,
    sentence: m.insights.possibleSentence(runnerUp.shortName, f.percent(needs)),
    needs,
  };
}
