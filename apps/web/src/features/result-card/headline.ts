import type { ResultsResponse } from '@stb/contracts';
import {
  countedPercentage,
  statesInRegion,
  type CountryResult,
  type Round,
  type Tally,
} from '@stb/domain';
import { countryRows, countryStandings } from '../../lib/countries';
import { finalistResults, leadOf, type Finalist } from '../../lib/finalists';
import { formatPercent, formatPoints, formatVotes } from '../../lib/format';
import { resolveTally, selectionTitle, type Selection } from '../../lib/selection';
import { stateLeads } from '../../lib/state-leads';

export interface HeadlineColumn {
  readonly finalist: Finalist;
  /** Big number: the share of valid votes, always. */
  readonly value: number;
  /** Party and total votes, always. */
  readonly note: string;
  /** In a region: how many of its states the finalist won (or leads). */
  readonly states: string | undefined;
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

function eyebrowOf(round: Round, selection: Selection): string {
  const base = `Presidente · ${ROUND_LABELS[round]}`;
  switch (selection.kind) {
    case 'country':
      return base;
    case 'state':
      return `${base} · ${selection.code}`;
    case 'abroad':
      return `${base} · votos de brasileiros no exterior`;
    case 'region':
      return `${base} · votos na região`;
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

const statesText = (n: number) => (n === 1 ? '1 estado' : `${n} estados`);

/** Third key figure abroad: in how many countries anyone voted, and who won where. */
function countriesStat(
  countries: readonly CountryResult[] | undefined,
  finalists: readonly Finalist[],
): Stat {
  if (!countries) return { label: 'Países com votos', value: '—', note: '' };
  const rows = countryRows(countries, finalists);
  const { wins } = countryStandings(rows, finalists);
  return {
    label: 'Países com votos',
    value: String(rows.length),
    note: finalists.map((f) => `${wins[f.number] ?? 0} ${f.shortName}`).join(' · '),
  };
}

/**
 * Headline of a tally: Brasil, a region, a state or abroad. Shares and vote totals are
 * always shown; a region also counts the states each finalist won.
 */
function tallyHeadline(
  data: ResultsResponse,
  selection: Selection,
  finalists: readonly Finalist[],
  tally: Tally,
  final: boolean,
  countries: readonly CountryResult[] | undefined,
): Pick<Headline, 'columns' | 'badge' | 'bar' | 'barLabel' | 'stats'> {
  const { round } = data;
  const regionLeads =
    selection.kind === 'region'
      ? stateLeads(data, finalists, statesInRegion(selection.code)).counts
      : undefined;
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
      note: `${finalist.party} · ${formatVotes(votes)} votos`,
      states: regionLeads
        ? `${final ? 'Venceu' : 'Lidera'} em ${statesText(regionLeads[finalist.number] ?? 0)}`
        : undefined,
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
      selection.kind === 'abroad'
        ? countriesStat(countries, finalists)
        : sectionsStat(tally, final),
    ],
  };
}

export function headlineOf(
  data: ResultsResponse,
  selection: Selection,
  finalists: readonly Finalist[],
  /** Votes abroad by country, once loaded; only used for abroad. */
  countries?: readonly CountryResult[],
): Headline {
  const tally = resolveTally(data, selection);
  const counted = countedPercentage(tally);
  const final = isFinal(data.round, counted);
  const body = tallyHeadline(data, selection, finalists, tally, final, countries);
  return {
    eyebrow: eyebrowOf(data.round, selection),
    title: selectionTitle(selection),
    counted,
    ...body,
  };
}
