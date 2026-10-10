import type { ResultsResponse } from '@stb/contracts';
import {
  countedPercentage,
  STATE_CODES,
  STATES,
  type Round,
  type StateCode,
  type Tally,
} from '@stb/domain';
import {
  finalistResults,
  leadOf,
  type CandidateHue,
  type Finalist,
  type FinalistResult,
} from '../../lib/finalists';
import { formatDate, formatPercent, formatPoints, formatTime } from '../../lib/format';
import { resolveTally, selectionTitle, type Selection } from '../../lib/selection';
import { SHARE_PALETTE } from './palette';

/** "Lula lidera em" / "12 estados". */
export interface LeadCount {
  readonly hue: CandidateHue;
  readonly label: string;
  readonly value: string;
}

/** Everything the share image shows, already resolved for the current selection. */
export interface ShareContent {
  readonly round: Round;
  /** "1º TURNO 2026 · RESULTADO FINAL". */
  readonly kicker: string;
  readonly title: string;
  readonly results: readonly FinalistResult[];
  readonly leaderNumber: string | undefined;
  /** Votes of everyone else (first round), drawn gray in the bar. */
  readonly othersVotes: number;
  /** Bottom line of the result card: margin and, in the first round, the others' share. */
  readonly notes: readonly [string, string];
  /** 0–100. */
  readonly counted: number;
  /** "Fonte: TSE · 05/10, 12:51". */
  readonly source: string;
  readonly mapFills: Readonly<Record<StateCode, string>>;
  /** States outside the selection are drawn faded. */
  readonly focus: ReadonlySet<StateCode>;
  /** How many states each finalist leads, within the region or the whole country. */
  readonly leadCounts: readonly LeadCount[];
  readonly siteUrl: string;
}

function statesText(count: number, withDistrict: boolean): string {
  const states = count === 1 ? '1 estado' : `${count} estados`;
  if (!withDistrict) return states;
  return count === 0 ? 'Distrito Federal' : `${states} + DF`;
}

/** Leads per finalist; the Federal District is not a state, so it is named apart. */
function leadCountsOf(
  data: ResultsResponse,
  finalists: readonly Finalist[],
  codes: readonly StateCode[],
): LeadCount[] {
  const leaders = codes.map((code) => ({
    code,
    lead: leadOf(finalistResults(data.states[code], finalists)),
  }));
  return finalists.map((f) => {
    const led = leaders.filter(({ lead }) => lead?.leader.number === f.number);
    const district = led.some(({ code }) => code === 'DF');
    return {
      hue: f.hue,
      label: `${f.shortName} lidera em`,
      value: statesText(led.length - (district ? 1 : 0), district),
    };
  });
}

export function shareContentFrom(
  data: ResultsResponse,
  selection: Selection,
  finalists: readonly Finalist[],
  siteUrl: string,
): ShareContent {
  const tally = resolveTally(data, selection);
  const results = finalistResults(tally, finalists);
  const lead = leadOf(results);
  const counted = countedPercentage(tally);
  const final = data.round === 1 || counted >= 100;

  const finalistNumbers = new Set(finalists.map((f) => f.number));
  const others = tally.candidates.filter((c) => !finalistNumbers.has(c.number));
  const othersShare = others.reduce((sum, c) => sum + c.share, 0);

  const fillOf = (scopeTally: Tally) => {
    const scopeLead = leadOf(finalistResults(scopeTally, finalists));
    const fill = scopeLead
      ? SHARE_PALETTE.ramps[scopeLead.hue][scopeLead.intensity - 1]
      : undefined;
    return fill ?? SHARE_PALETTE.mapEmpty;
  };
  const mapFills = Object.fromEntries(
    STATE_CODES.map((code) => [code, fillOf(data.states[code])]),
  ) as Record<StateCode, string>;

  const focus = new Set(
    STATE_CODES.filter(
      (code) =>
        selection.kind === 'country' ||
        selection.kind === 'abroad' ||
        (selection.kind === 'region' && STATES[code].region === selection.code) ||
        (selection.kind === 'state' && selection.code === code),
    ),
  );
  const countScope =
    selection.kind === 'region' ? STATE_CODES.filter((code) => focus.has(code)) : STATE_CODES;

  const { updatedAt } = tally;
  return {
    round: data.round,
    kicker:
      `${data.round}º turno 2026 · ${final ? 'resultado final' : 'apuração ao vivo'}`.toUpperCase(),
    title: selectionTitle(selection),
    results,
    leaderNumber: lead?.leader.number,
    othersVotes: others.reduce((sum, c) => sum + c.votes, 0),
    notes: [
      lead ? `Diferença: ${formatPoints(lead.margin)}` : 'Sem votos apurados',
      others.length > 0 ? `Demais candidatos: ${formatPercent(othersShare)}` : '',
    ],
    counted,
    source: final
      ? `Fonte: TSE · ${formatDate(updatedAt)}, ${formatTime(updatedAt)}`
      : `Atualizado às ${formatTime(updatedAt)} · Fonte: TSE`,
    mapFills,
    focus,
    leadCounts: leadCountsOf(data, finalists, countScope),
    siteUrl,
  };
}
