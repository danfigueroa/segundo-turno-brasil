import type { ResultsResponse } from '@stb/contracts';
import {
  countedElectorateOf,
  countedPercentage,
  statesInRegion,
  type CountryResult,
  type Round,
  type Tally,
} from '@stb/domain';
import { countryRows, countryStandings } from '../../lib/countries';
import { finalistResults, leadOf, type Finalist } from '../../lib/finalists';
import {
  formatCompactVotes,
  formatName,
  formatPercent,
  formatPoints,
  formatVotes,
} from '../../lib/format';
import {
  resolveTally,
  selectionTitle,
  type Municipalities,
  type Selection,
} from '../../lib/selection';
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

/** A candidate beyond the two finalists (first round only). */
export interface OtherCandidate {
  readonly number: string;
  readonly name: string;
  readonly party: string;
  /** Percentage of valid votes, 0–100. */
  readonly share: number;
  readonly votes: number;
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
  /** Second row: valid votes, turnout and blank plus null votes. */
  readonly turnoutStats: readonly Stat[];
  /** Counted sections in the selection, 0–100. */
  readonly counted: number;
  /** Everyone else on the ballot, most voted first; empty in the runoff. */
  readonly others: readonly OtherCandidate[];
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
    case 'abroadCountry':
      return `${base} · votos de brasileiros no exterior`;
    case 'city':
      return `${base} · ${selection.state}`;
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

/** `part` as a percentage of `whole`, or a dash before anyone has voted. */
function percentOf(part: number, whole: number): string {
  return whole > 0 ? formatPercent((part / whole) * 100) : '—';
}

/** Second row of key figures: who voted and how, in every scope and round. */
export function turnoutStats(tally: Tally): Stat[] {
  // Measured against the sections counted so far, so it holds during the count.
  const electorate = countedElectorateOf(tally);
  const { turnout, votes } = tally;
  const blankAndNull = votes.blank + votes.null;
  return [
    {
      label: 'Votos válidos',
      // Compact ("119,3 mi"): the full count does not fit a third of a 360px card.
      value: formatCompactVotes(votes.valid),
      note: turnout > 0 ? `${percentOf(votes.valid, turnout)} do comparecimento` : '',
    },
    {
      label: 'Comparecimento',
      value: percentOf(turnout, electorate),
      note: `${formatVotes(turnout)} eleitores`,
    },
    {
      label: 'Brancos e nulos',
      value: percentOf(blankAndNull, turnout),
      note: `${formatVotes(blankAndNull)} votos`,
    },
  ];
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
): Pick<Headline, 'columns' | 'badge' | 'bar' | 'barLabel' | 'stats' | 'turnoutStats' | 'others'> {
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

  const abstention = Math.max(countedElectorateOf(tally) - tally.turnout, 0);
  const secondStat: Stat =
    round === 1
      ? { label: 'Demais candidatos', value: formatPercent(othersShare), note: '' }
      : {
          label: 'Abstenção',
          value: percentOf(abstention, countedElectorateOf(tally)),
          note: `${formatVotes(abstention)} eleitores`,
        };

  return {
    others: others.map((c) => ({
      number: c.number,
      name: formatName(c.name),
      party: c.party,
      share: c.share,
      votes: c.votes,
    })),
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
          : selection.kind === 'state' || selection.kind === 'city'
            ? `${lead.leader.shortName} à frente`
            : `${formatVotes(gap)} votos`,
      },
      secondStat,
      selection.kind === 'abroad'
        ? countriesStat(countries, finalists)
        : sectionsStat(tally, final),
    ],
    turnoutStats: turnoutStats(tally),
  };
}

export function headlineOf(
  data: ResultsResponse,
  selection: Selection,
  finalists: readonly Finalist[],
  /** Votes abroad by country, once loaded; only used for abroad and its countries. */
  countries?: readonly CountryResult[],
  /** Municipalities of the selected state, once loaded; only used for a city. */
  cities?: Municipalities,
): Headline {
  const tally = resolveTally(data, selection, cities, countries);
  const counted = countedPercentage(tally);
  const final = isFinal(data.round, counted);
  const body = tallyHeadline(data, selection, finalists, tally, final, countries);
  return {
    eyebrow: eyebrowOf(data.round, selection),
    title: selectionTitle(selection, cities, countries),
    counted,
    ...body,
  };
}
