import type { ResultsResponse } from '@stb/contracts';
import { countedPercentage, statesInRegion, type Round, type Tally } from '@stb/domain';
import { finalistResults, leadOf, type Finalist } from '../../lib/finalists';
import { formatPercent, formatPoints, formatVotes } from '../../lib/format';
import { resolveTally, selectionTitle, type Selection } from '../../lib/selection';
import { stateLeads } from '../../lib/state-leads';

export interface HeadlineColumn {
  readonly finalist: Finalist;
  /** Big number: a vote share, or a count of states in a region. */
  readonly value: number;
  readonly unit: 'percent' | 'count';
  readonly note: string;
  readonly leads: boolean;
}

export interface BarSegment {
  readonly key: string;
  readonly tone: Finalist['hue'] | 'others' | 'undecided';
  readonly weight: number;
}

export interface Stat {
  readonly label: string;
  readonly value: string;
  readonly note: string;
}

/** Everything the result card shows for one selection. */
export interface Headline {
  readonly eyebrow: string;
  readonly title: string;
  readonly columns: readonly HeadlineColumn[];
  readonly badge: string;
  readonly bar: readonly BarSegment[];
  readonly barLabel: string;
  readonly stats: readonly Stat[];
  /** Counted sections in the selection, 0–100. */
  readonly counted: number;
}

const ROUND_LABELS: Readonly<Record<Round, string>> = { 1: '1º turno', 2: '2º turno' };

function isFinal(round: Round, counted: number) {
  return round === 1 || counted >= 100;
}

function eyebrowOf(round: Round, selection: Selection, final: boolean): string {
  const base = `Presidente · ${ROUND_LABELS[round]}`;
  switch (selection.kind) {
    case 'country':
      return base;
    case 'state':
      return `${base} · ${selection.code}`;
    case 'abroad':
      return `${base} · votos de brasileiros no exterior`;
    case 'region':
      return `${base} · estados em que cada um ${final ? 'ficou à frente' : 'lidera'}`;
  }
}

function sectionsStat(tally: Tally, final: boolean): Stat {
  const { total, counted } = tally.sections;
  return {
    label: 'Seções apuradas',
    value: formatPercent(countedPercentage(tally)),
    note: final ? '' : `${formatVotes(counted)} de ${formatVotes(total)}`,
  };
}

/** Headline of a region: how many of its states each finalist leads. */
function regionHeadline(
  data: ResultsResponse,
  selection: Extract<Selection, { kind: 'region' }>,
  finalists: readonly Finalist[],
  tally: Tally,
  final: boolean,
): Pick<Headline, 'columns' | 'badge' | 'bar' | 'barLabel' | 'stats'> {
  const codes = statesInRegion(selection.code);
  const { counts, undecided, widest } = stateLeads(data, finalists, codes);
  const top = Math.max(...finalists.map((f) => counts[f.number] ?? 0));
  const tied = finalists.filter((f) => counts[f.number] === top).length > 1;
  const [first, second] = finalists;
  return {
    columns: finalists.map((finalist) => {
      const value = counts[finalist.number] ?? 0;
      return {
        finalist,
        value,
        unit: 'count',
        note: value === 1 ? 'estado' : 'estados',
        leads: !tied && value === top && value > 0,
      };
    }),
    badge: 'Lidera mais',
    bar: [
      { key: 'first', tone: first?.hue ?? 'red', weight: counts[first?.number ?? ''] ?? 0 },
      { key: 'undecided', tone: 'undecided', weight: undecided },
      { key: 'second', tone: second?.hue ?? 'blue', weight: counts[second?.number ?? ''] ?? 0 },
    ],
    barLabel: 'metade dos estados',
    stats: [
      { label: 'Estados na região', value: String(codes.length), note: '' },
      {
        label: 'Maior vantagem',
        value: widest ? formatPoints(widest.lead.margin) : '—',
        note: widest ? `${widest.lead.leader.shortName} · ${widest.code}` : '',
      },
      sectionsStat(tally, final),
    ],
  };
}

/** Headline of a single tally: Brasil, a state or abroad. */
function tallyHeadline(
  round: Round,
  selection: Selection,
  finalists: readonly Finalist[],
  tally: Tally,
  final: boolean,
): Pick<Headline, 'columns' | 'badge' | 'bar' | 'barLabel' | 'stats'> {
  const results = finalistResults(tally, finalists);
  const lead = leadOf(results);
  const finalistNumbers = new Set(finalists.map((f) => f.number));
  const others = tally.candidates.filter((c) => !finalistNumbers.has(c.number));
  const othersVotes = others.reduce((sum, c) => sum + c.votes, 0);
  const othersShare = others.reduce((sum, c) => sum + c.share, 0);
  const [first, second] = results;
  const gap = first && second ? Math.abs(first.votes - second.votes) : 0;

  const turnoutShare = tally.electorate > 0 ? (tally.turnout / tally.electorate) * 100 : 0;
  const secondStat: Stat =
    round === 1
      ? { label: 'Demais candidatos', value: formatPercent(othersShare), note: '' }
      : {
          label: 'Comparecimento',
          value: formatPercent(turnoutShare),
          note: `${formatVotes(tally.turnout)} eleitores`,
        };

  return {
    columns: results.map(({ votes, share, ...finalist }) => ({
      finalist,
      value: share,
      unit: 'percent',
      note: `${finalist.party} · ${formatVotes(votes)} votos`,
      leads: lead?.leader.number === finalist.number,
    })),
    badge: final ? 'Mais votado' : 'Lidera',
    bar: [
      { key: 'first', tone: first?.hue ?? 'red', weight: first?.votes ?? 0 },
      { key: 'others', tone: 'others', weight: othersVotes },
      { key: 'second', tone: second?.hue ?? 'blue', weight: second?.votes ?? 0 },
    ],
    barLabel: '50% dos votos válidos',
    stats: [
      {
        label: 'Diferença',
        value: lead ? formatPoints(lead.margin) : '—',
        note: !lead
          ? ''
          : selection.kind === 'state'
            ? `${lead.leader.shortName} à frente`
            : `${formatVotes(gap)} votos`,
      },
      secondStat,
      sectionsStat(tally, final),
    ],
  };
}

export function headlineOf(
  data: ResultsResponse,
  selection: Selection,
  finalists: readonly Finalist[],
): Headline {
  const tally = resolveTally(data, selection);
  const counted = countedPercentage(tally);
  const final = isFinal(data.round, counted);
  const body =
    selection.kind === 'region'
      ? regionHeadline(data, selection, finalists, tally, final)
      : tallyHeadline(data.round, selection, finalists, tally, final);
  return {
    eyebrow: eyebrowOf(data.round, selection, final),
    title: selectionTitle(selection),
    counted,
    ...body,
  };
}
