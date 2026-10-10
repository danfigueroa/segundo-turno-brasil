import type { MunicipalityResult, StateCode } from '@stb/domain';
import type { CitiesSource } from '../ports/cities-source';
import { GetLatest, type GetLatestOptions } from './get-latest';

export interface CitiesSnapshot {
  readonly cities: readonly MunicipalityResult[];
  readonly fetchedAt: string;
  readonly stale: boolean;
}

/**
 * Latest breakdown by municipality of each state, with the same sharing and stale fallback
 * as the results, kept separately per state.
 */
export class GetCities {
  private readonly latest = new Map<StateCode, GetLatest<readonly MunicipalityResult[]>>();

  constructor(
    private readonly source: CitiesSource,
    private readonly options: GetLatestOptions = {},
  ) {}

  async execute(uf: StateCode): Promise<CitiesSnapshot> {
    let latest = this.latest.get(uf);
    if (!latest) {
      latest = new GetLatest(() => this.source.fetchCities(uf), this.options);
      this.latest.set(uf, latest);
    }
    const { value, fetchedAt, stale } = await latest.execute();
    return { cities: value, fetchedAt, stale };
  }
}
