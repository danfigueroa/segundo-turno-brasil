import { aggregateCountries, type AbroadBreakdown, type AbroadCityResult } from '@stb/domain';
import type { AbroadSource } from '../../ports/abroad-source';
import { clamp, progressOf, tiltOf, type SimulationOptions } from './simulated-results-source';

/**
 * Replays the final breakdown abroad as a live count, like `SimulatedResultsSource`: only
 * the two front-runners, each city at its own pace, converging to the final result. The
 * countries add up the simulated cities, so both levels always agree.
 */
export class SimulatedAbroadSource implements AbroadSource {
  private finalResults: Promise<AbroadBreakdown> | undefined;

  constructor(
    private readonly inner: AbroadSource,
    private readonly options: SimulationOptions,
  ) {}

  async fetchAbroad(): Promise<AbroadBreakdown> {
    this.finalResults ??= this.inner.fetchAbroad();
    const final = await this.finalResults;

    const now = (this.options.now ?? Date.now)();
    const elapsed = clamp((now - this.options.startedAt) / this.options.durationMs);
    const finalists = frontRunners(final.cities);

    const cities = final.cities.map((city): AbroadCityResult => {
      const progress = progressOf(city.code, elapsed);
      const tilt = tiltOf(city.code) * (1 - progress);
      const votes = Object.fromEntries(
        finalists.map((number, index) => {
          const bias = 1 + tilt * (index === 0 ? 1 : -1);
          return [number, Math.round((city.votes[number] ?? 0) * progress * bias)];
        }),
      );
      const { total } = city.sections;
      const counted = (n: number) => Math.round(n * progress);
      const valid = Object.values(votes).reduce((sum, v) => sum + v, 0);
      const ballots = {
        valid,
        blank: counted(city.ballots.blank),
        null: counted(city.ballots.null),
      };
      return {
        ...city,
        votes,
        ballots,
        turnout: valid + ballots.blank + ballots.null,
        sections: { total, counted: counted(total) },
      };
    });
    return { countries: aggregateCountries(cities), cities };
  }
}

/** Ballot numbers of the two most voted candidates abroad. */
function frontRunners(cities: readonly AbroadCityResult[]): string[] {
  const totals = new Map<string, number>();
  for (const city of cities) {
    for (const [number, votes] of Object.entries(city.votes)) {
      totals.set(number, (totals.get(number) ?? 0) + votes);
    }
  }
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([number]) => number);
}
