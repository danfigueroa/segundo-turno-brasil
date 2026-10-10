import {
  aggregateCountries,
  type AbroadBreakdown,
  type AbroadCityResult,
  type Tally,
} from '@stb/domain';
import type { AbroadSource } from '../../ports/abroad-source';
import { ABROAD_CITIES, type AbroadCity } from './abroad-cities';
import { mapWithLimit } from './map-with-limit';
import { toTally } from './mapper';
import { tseResultFileSchema } from './schema';
import { TseParseError, type TseFileLoader } from './tse-results-source';

/** TSE scope code of a city abroad: `zz` + its city code. */
export function abroadCityScope(cityCode: string): string {
  return `zz${cityCode}`;
}

export interface TseAbroadSourceOptions {
  readonly cities?: Readonly<Record<string, AbroadCity>>;
  /** Simultaneous requests to the TSE. */
  readonly concurrency?: number;
}

/**
 * Builds the breakdown by city and country from the TSE files of each city abroad (186 in
 * 2026). Fails as a whole if any city fails, so a country is never shown with missing cities.
 */
export class TseAbroadSource implements AbroadSource {
  private readonly cities: Readonly<Record<string, AbroadCity>>;
  private readonly concurrency: number;

  constructor(
    private readonly load: TseFileLoader,
    options: TseAbroadSourceOptions = {},
  ) {
    this.cities = options.cities ?? ABROAD_CITIES;
    this.concurrency = options.concurrency ?? 24;
  }

  async fetchAbroad(): Promise<AbroadBreakdown> {
    const entries = Object.entries(this.cities);
    const cities = await mapWithLimit(entries, this.concurrency, async ([code, city]) => {
      const scope = abroadCityScope(code);
      const parsed = tseResultFileSchema.safeParse(await this.load(scope));
      if (!parsed.success) throw new TseParseError(scope, parsed.error);
      return cityResult(code, city, toTally(parsed.data, { kind: 'abroad' }));
    });
    return { countries: aggregateCountries(cities), cities };
  }
}

function cityResult(code: string, city: AbroadCity, tally: Tally): AbroadCityResult {
  return {
    code,
    name: city.city,
    country: city.country,
    continent: city.continent,
    lat: city.lat,
    lon: city.lon,
    electorate: tally.electorate,
    turnout: tally.turnout,
    votes: Object.fromEntries(tally.candidates.map((c) => [c.number, c.votes])),
    ballots: tally.votes,
    sections: tally.sections,
    updatedAt: tally.updatedAt,
  };
}
