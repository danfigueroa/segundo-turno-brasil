import { outlook, type Tally } from '@stb/domain';
import type { Finalist } from '../../lib/finalists';
import { formatPercent } from '../../lib/format';

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
export function outlookView(tally: Tally, finalists: readonly Finalist[]): OutlookView | undefined {
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
      status: 'Decidido',
      headline: 'Não dá mais para virar',
      sentence: `Mesmo que todos os eleitores ainda não apurados votassem em ${runnerUp.shortName}, ${leader.shortName} continuaria à frente.`,
      needs: undefined,
    };
  }
  if (needs === undefined || needs > 100) {
    return {
      ...base,
      decided: false,
      status: 'Em aberto',
      headline: 'Virada improvável',
      sentence: `Pela estimativa, ${runnerUp.shortName} precisaria de mais votos do que os que faltam apurar.`,
      needs: 100,
    };
  }
  return {
    ...base,
    decided: false,
    status: 'Em aberto',
    headline: 'Ainda dá virada',
    sentence: `${runnerUp.shortName} precisa de ${formatPercent(needs)} dos votos válidos que faltam para virar.`,
    needs,
  };
}
