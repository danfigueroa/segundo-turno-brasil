import type { MunicipalityResult, StateCode } from '@stb/domain';
import type { CitiesSource } from '../../ports/cities-source';
import { clamp, progressOf, tiltOf, type SimulationOptions } from './simulated-results-source';

/**
 * Replays the final breakdown by municipality as a live count, at the pace and with the
 * early-count tilt `SimulatedResultsSource` gives the whole state, so the municipalities
 * add up to the simulated state. Only the state's two front-runners are kept.
 */
export class SimulatedCitiesSource implements CitiesSource {
  private readonly finalResults = new Map<StateCode, Promise<readonly MunicipalityResult[]>>();

  constructor(
    private readonly inner: CitiesSource,
    private readonly options: SimulationOptions,
  ) {}

  async fetchCities(uf: StateCode): Promise<MunicipalityResult[]> {
    let final = this.finalResults.get(uf);
    if (!final) {
      final = this.inner.fetchCities(uf);
      final.catch(() => this.finalResults.delete(uf));
      this.finalResults.set(uf, final);
    }
    const cities = await final;

    const now = (this.options.now ?? Date.now)();
    const elapsed = clamp((now - this.options.startedAt) / this.options.durationMs);
    const progress = progressOf(uf, elapsed);
    const tilt = tiltOf(uf) * (1 - progress);
    const finalists = frontRunners(cities);
    const updatedAt = new Date(now).toISOString();
    const scale = (value: number) => Math.round(value * progress);

    return cities.map((city) => {
      const votes = Object.fromEntries(
        finalists.map((number, index) => {
          const bias = 1 + tilt * (index === 0 ? 1 : -1);
          return [number, Math.round((city.votes[number] ?? 0) * progress * bias)];
        }),
      );
      return {
        ...city,
        turnout: scale(city.turnout),
        votes,
        ballots: {
          valid: Object.values(votes).reduce((sum, v) => sum + v, 0),
          blank: scale(city.ballots.blank),
          null: scale(city.ballots.null),
        },
        sections: { total: city.sections.total, counted: scale(city.sections.total) },
        updatedAt,
      };
    });
  }
}

/** Ballot numbers of the two most voted candidates across the state's municipalities. */
function frontRunners(cities: readonly MunicipalityResult[]): string[] {
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
