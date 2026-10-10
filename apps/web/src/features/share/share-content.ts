import type { ResultsResponse } from '@stb/contracts';
import {
  countedPercentage,
  STATE_CODES,
  STATES,
  type CountryResult,
  type MunicipalityResult,
  type Round,
  type StateCode,
  type Tally,
} from '@stb/domain';
import { cityRows, cityWins } from '../../lib/cities';
import { countryRows, countryStandings } from '../../lib/countries';
import {
  finalistResults,
  leadOf,
  leadOfVotes,
  type CandidateHue,
  type Finalist,
  type FinalistResult,
} from '../../lib/finalists';
import { formatDate, formatPercent, formatPoints, formatTime } from '../../lib/format';
import { countryOf, resolveTally, selectionTitle, type Selection } from '../../lib/selection';
import type { StateMapShape } from '../state-map/state-maps';
import type { ContinentMapShape } from '../world-map/continent-maps';
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
  /**
   * Drawn instead of the map of Brazil: a city on its state's municipal map, a country
   * abroad on the map of its continent.
   */
  readonly detailMap: DetailMap | undefined;
  /**
   * How many states each finalist leads, within the region or the whole country; for a
   * city, how many of its state's municipalities; for a country abroad, how many
   * countries.
   */
  readonly leadCounts: readonly LeadCount[];
  readonly siteUrl: string;
}

/** Areas colored by leader (municipalities or countries), with the selected one outlined. */
export interface DetailMap {
  readonly viewBox: string;
  readonly shapes: readonly { readonly d: string; readonly fill: string }[];
  /** Path of the selected area. */
  readonly selected: string | undefined;
}

/** The selected state's municipalities and their map, to share a city. */
export interface StateDetail {
  readonly cities: readonly MunicipalityResult[];
  readonly map: StateMapShape;
}

/** The countries abroad and the selected country's continent map, to share a country. */
export interface AbroadDetail {
  readonly countries: readonly CountryResult[];
  /** `undefined` while loading: the country is then shared on the map of Brazil. */
  readonly map: ContinentMapShape | undefined;
}

/** Radius of the marker of a country too small to see, as on the site's map. */
const MARKER_RADIUS = 9;

const citiesText = (n: number) => (n === 1 ? '1 cidade' : `${n} cidades`);
const countriesText = (n: number) => (n === 1 ? '1 país' : `${n} países`);

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
  /** Needed to share a city; without it, a city is shared like its state. */
  detail?: StateDetail,
  /** Needed to share a country abroad; without it, it is shared like abroad. */
  abroad?: AbroadDetail,
): ShareContent {
  const cities = detail?.cities;
  const countries = abroad?.countries;
  const tally = resolveTally(data, selection, cities, countries);
  const results = finalistResults(tally, finalists);
  const lead = leadOf(results);
  const counted = countedPercentage(tally);
  const final = data.round === 1 || counted >= 100;

  const finalistNumbers = new Set(finalists.map((f) => f.number));
  const others = tally.candidates.filter((c) => !finalistNumbers.has(c.number));
  const othersShare = others.reduce((sum, c) => sum + c.share, 0);

  const fillOfLead = (scopeLead: ReturnType<typeof leadOf>) => {
    const fill = scopeLead
      ? SHARE_PALETTE.ramps[scopeLead.hue][scopeLead.intensity - 1]
      : undefined;
    return fill ?? SHARE_PALETTE.mapEmpty;
  };
  const fillOf = (scopeTally: Tally) => fillOfLead(leadOf(finalistResults(scopeTally, finalists)));
  const mapFills = Object.fromEntries(
    STATE_CODES.map((code) => [code, fillOf(data.states[code])]),
  ) as Record<StateCode, string>;

  const focus = new Set(
    STATE_CODES.filter(
      (code) =>
        selection.kind === 'country' ||
        selection.kind === 'abroad' ||
        selection.kind === 'abroadCountry' ||
        (selection.kind === 'region' && STATES[code].region === selection.code) ||
        (selection.kind === 'state' && selection.code === code) ||
        (selection.kind === 'city' && selection.state === code),
    ),
  );
  const countScope =
    selection.kind === 'region' ? STATE_CODES.filter((code) => focus.has(code)) : STATE_CODES;

  const detailMap =
    selection.kind === 'city' && detail
      ? municipalMapOf(detail, selection.ibge, (votes) => fillOfLead(leadOfVotes(votes, finalists)))
      : undefined;
  const cityLeadCounts = detailMap && cities ? cityLeadCountsOf(cities, finalists) : undefined;

  const country = countryOf(selection, countries);
  const continentMap =
    country && abroad?.map
      ? continentMapOf(abroad.map, abroad.countries, country, (votes) =>
          fillOfLead(leadOfVotes(votes, finalists)),
        )
      : undefined;
  const countryLeadCounts =
    countries && country ? countryLeadCountsOf(countries, finalists) : undefined;

  const { updatedAt } = tally;
  return {
    round: data.round,
    kicker:
      `${data.round}º turno 2026 · ${final ? 'resultado final' : 'apuração ao vivo'}`.toUpperCase(),
    title: selectionTitle(selection, cities, countries),
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
    detailMap: detailMap ?? continentMap,
    leadCounts: cityLeadCounts ?? countryLeadCounts ?? leadCountsOf(data, finalists, countScope),
    siteUrl,
  };
}

function municipalMapOf(
  { cities, map }: StateDetail,
  selected: string,
  fillOf: (votes: MunicipalityResult['votes']) => string,
): DetailMap {
  const byIbge = new Map(cities.map((c) => [c.ibge, c]));
  return {
    viewBox: map.viewBox,
    shapes: Object.entries(map.cities).map(([ibge, d]) => {
      const city = byIbge.get(ibge);
      return { d, fill: city ? fillOf(city.votes) : SHARE_PALETTE.mapEmpty };
    }),
    selected: map.cities[selected],
  };
}

function cityLeadCountsOf(
  cities: readonly MunicipalityResult[],
  finalists: readonly Finalist[],
): LeadCount[] {
  const wins = cityWins(cityRows(cities, finalists), finalists);
  return finalists.map((f) => ({
    hue: f.hue,
    label: `${f.shortName} lidera em`,
    value: citiesText(wins[f.number] ?? 0),
  }));
}

/**
 * The continent of the selected country, as on the site: countries with polling stations
 * colored by leader, the others lighter, Brazil darker and tiny countries of the continent
 * with a round marker.
 */
function continentMapOf(
  map: ContinentMapShape,
  countries: readonly CountryResult[],
  selected: CountryResult,
  fillOf: (votes: CountryResult['votes']) => string,
): DetailMap {
  const byName = new Map(countries.map((c) => [c.name, c]));
  const fill = (name: string | undefined, brazil: boolean | undefined) => {
    const country = name ? byName.get(name) : undefined;
    if (country) return fillOf(country.votes);
    return brazil ? SHARE_PALETTE.mapBrazil : SHARE_PALETTE.mapOther;
  };
  const markers = map.countries.flatMap((shape) => {
    const country = shape.name ? byName.get(shape.name) : undefined;
    const [x, y] = shape.label ?? [];
    if (!shape.tiny || !country || country.continent !== selected.continent) return [];
    if (x === undefined || y === undefined) return [];
    return [{ name: country.name, d: circle(x, y, MARKER_RADIUS), fill: fillOf(country.votes) }];
  });
  const shapes = [
    ...map.countries.map((shape) => ({
      name: shape.name,
      d: shape.d,
      fill: fill(shape.name, shape.brazil),
    })),
    ...markers,
  ];
  // A tiny country is outlined by its marker, the others by their shape.
  const outline =
    markers.find((m) => m.name === selected.name) ?? shapes.find((s) => s.name === selected.name);
  return {
    viewBox: map.viewBox,
    shapes: shapes.map(({ d, fill }) => ({ d, fill })),
    selected: outline?.d,
  };
}

/** SVG path of a circle, for `Path2D`. */
function circle(x: number, y: number, r: number): string {
  return `M${x - r},${y}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0Z`;
}

function countryLeadCountsOf(
  countries: readonly CountryResult[],
  finalists: readonly Finalist[],
): LeadCount[] {
  const { wins } = countryStandings(countryRows(countries, finalists), finalists);
  return finalists.map((f) => ({
    hue: f.hue,
    label: `${f.shortName} lidera em`,
    value: countriesText(wins[f.number] ?? 0),
  }));
}
