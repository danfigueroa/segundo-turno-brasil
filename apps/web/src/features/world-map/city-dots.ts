import type { AbroadCityResult } from '@stb/domain';
import { leadOf, type Finalist, type StateLead } from '../../lib/finalists';
import { formatName } from '../../lib/format';
import { project, type Projection } from './project';

export interface CityDot {
  readonly code: string;
  /** Display name, e.g. "Nova York". */
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly r: number;
  /** Who leads the city among the finalists; `undefined` before any vote or on a tie. */
  readonly lead: StateLead | undefined;
}

/** Radius of the biggest city, in viewBox units (the map is 1000 wide). */
const MAX_RADIUS = 16;
const MIN_RADIUS = 3;

/** Leader and margin of a city, with shares of its valid votes (every candidate's votes). */
export function cityLead(
  city: AbroadCityResult,
  finalists: readonly Finalist[],
): StateLead | undefined {
  const valid = Object.values(city.votes).reduce((sum, votes) => sum + votes, 0);
  return leadOf(
    finalists.map((f) => {
      const votes = city.votes[f.number] ?? 0;
      return { ...f, votes, share: valid > 0 ? (votes / valid) * 100 : 0 };
    }),
  );
}

/**
 * One dot per city, its area proportional to the electorate, biggest first so the small
 * ones are drawn on top and stay visible.
 */
export function cityDots(
  cities: readonly AbroadCityResult[],
  finalists: readonly Finalist[],
  projection: Projection,
): CityDot[] {
  const largest = Math.max(1, ...cities.map((c) => c.electorate));
  return cities
    .map((city) => {
      const [x, y] = project(projection, city.lon, city.lat);
      return {
        code: city.code,
        name: formatName(city.name),
        x,
        y,
        r: Math.max(MIN_RADIUS, MAX_RADIUS * Math.sqrt(city.electorate / largest)),
        lead: cityLead(city, finalists),
      };
    })
    .sort((a, b) => b.r - a.r || a.code.localeCompare(b.code));
}

/**
 * Names for the biggest cities, skipping any too close to one already labeled so the
 * labels do not overlap (Boston and Nova York, say).
 */
export function labeledDots(dots: readonly CityDot[], count: number, minDistance = 150): CityDot[] {
  const labeled: CityDot[] = [];
  for (const dot of dots) {
    if (labeled.length === count) break;
    if (labeled.every((l) => Math.hypot(l.x - dot.x, l.y - dot.y) >= minDistance)) {
      labeled.push(dot);
    }
  }
  return labeled;
}
