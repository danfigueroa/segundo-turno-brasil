import type { CountryResult } from '@stb/domain';
import type { AbroadSource } from '../ports/abroad-source';
import { GetLatest, type GetLatestOptions } from './get-latest';

export interface AbroadSnapshot {
  readonly countries: readonly CountryResult[];
  readonly fetchedAt: string;
  readonly stale: boolean;
}

/** Latest breakdown by country, with the same sharing and stale fallback as the results. */
export class GetAbroad {
  private readonly latest: GetLatest<readonly CountryResult[]>;

  constructor(source: AbroadSource, options: GetLatestOptions = {}) {
    this.latest = new GetLatest(() => source.fetchCountries(), options);
  }

  async execute(): Promise<AbroadSnapshot> {
    const { value, fetchedAt, stale } = await this.latest.execute();
    return { countries: value, fetchedAt, stale };
  }
}
