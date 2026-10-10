import type { CountryResult } from '@stb/domain';
import type { AbroadSource } from '../../ports/abroad-source';
import { clamp, progressOf, tiltOf, type SimulationOptions } from './simulated-results-source';

/**
 * Replays the final breakdown by country as a live count, like `SimulatedResultsSource`:
 * only the two front-runners, each country at its own pace, converging to the final result.
 */
export class SimulatedAbroadSource implements AbroadSource {
  private finalResults: Promise<readonly CountryResult[]> | undefined;

  constructor(
    private readonly inner: AbroadSource,
    private readonly options: SimulationOptions,
  ) {}

  async fetchCountries(): Promise<CountryResult[]> {
    this.finalResults ??= this.inner.fetchCountries();
    const final = await this.finalResults;

    const now = (this.options.now ?? Date.now)();
    const elapsed = clamp((now - this.options.startedAt) / this.options.durationMs);
    const totals = new Map<string, number>();
    for (const country of final) {
      for (const [number, votes] of Object.entries(country.votes)) {
        totals.set(number, (totals.get(number) ?? 0) + votes);
      }
    }
    const finalists = [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([number]) => number);

    return final.map((country) => {
      const progress = progressOf(country.name, elapsed);
      const tilt = tiltOf(country.name) * (1 - progress);
      const votes = Object.fromEntries(
        finalists.map((number, index) => {
          const bias = 1 + tilt * (index === 0 ? 1 : -1);
          return [number, Math.round((country.votes[number] ?? 0) * progress * bias)];
        }),
      );
      const { total } = country.sections;
      return { ...country, votes, sections: { total, counted: Math.round(total * progress) } };
    });
  }
}
