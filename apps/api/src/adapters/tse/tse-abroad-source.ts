import type { CountryResult } from '@stb/domain';
import type { AbroadSource } from '../../ports/abroad-source';
import { ABROAD_CITIES, type AbroadCity } from './abroad-cities';
import { toTally } from './mapper';
import { tseResultFileSchema } from './schema';
import { TseParseError, type TseFileLoader } from './tse-results-source';

/** TSE scope code of a city abroad: `zz` + its city code. */
export function abroadCityScope(cityCode: string): string {
  return `zz${cityCode}`;
}

/** Runs `task` over `items` with at most `limit` in flight, keeping the order. */
async function mapWithLimit<T, R>(
  items: readonly T[],
  limit: number,
  task: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await task(items[index] as T);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export interface TseAbroadSourceOptions {
  readonly cities?: Readonly<Record<string, AbroadCity>>;
  /** Simultaneous requests to the TSE. */
  readonly concurrency?: number;
}

/**
 * Builds the breakdown by country from the TSE files of each city abroad (186 in 2026).
 * Fails as a whole if any city fails, so a country is never shown with missing cities.
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

  async fetchCountries(): Promise<CountryResult[]> {
    const entries = Object.entries(this.cities);
    const tallies = await mapWithLimit(entries, this.concurrency, async ([code]) => {
      const scope = abroadCityScope(code);
      const parsed = tseResultFileSchema.safeParse(await this.load(scope));
      if (!parsed.success) throw new TseParseError(scope, parsed.error);
      return toTally(parsed.data, { kind: 'abroad' });
    });

    const countries = new Map<string, CountryResult>();
    entries.forEach(([, city], index) => {
      const tally = tallies[index];
      if (!tally) return;
      const current = countries.get(city.country);
      const votes: Record<string, number> = { ...current?.votes };
      for (const candidate of tally.candidates) {
        votes[candidate.number] = (votes[candidate.number] ?? 0) + candidate.votes;
      }
      countries.set(city.country, {
        name: city.country,
        continent: city.continent,
        votes,
        sections: {
          total: (current?.sections.total ?? 0) + tally.sections.total,
          counted: (current?.sections.counted ?? 0) + tally.sections.counted,
        },
      });
    });
    return [...countries.values()];
  }
}
