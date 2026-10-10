import type { AbroadBreakdown } from '@stb/domain';
import type { AbroadSource } from '../ports/abroad-source';
import { GetLatest, type GetLatestOptions } from './get-latest';

export interface AbroadSnapshot extends AbroadBreakdown {
  readonly fetchedAt: string;
  readonly stale: boolean;
}

/** Latest breakdown by country and city, with the same sharing and stale fallback as the results. */
export class GetAbroad {
  private readonly latest: GetLatest<AbroadBreakdown>;

  constructor(source: AbroadSource, options: GetLatestOptions = {}) {
    this.latest = new GetLatest(() => source.fetchAbroad(), options);
  }

  async execute(): Promise<AbroadSnapshot> {
    const { value, fetchedAt, stale } = await this.latest.execute();
    return { ...value, fetchedAt, stale };
  }
}
