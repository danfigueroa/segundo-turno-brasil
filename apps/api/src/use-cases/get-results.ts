import type { ElectionSnapshot, ResultsSource } from '../ports/results-source';
import { GetLatest, type GetLatestOptions } from './get-latest';

export interface ResultsSnapshot extends ElectionSnapshot {
  /** When the snapshot was fetched from the source. */
  readonly fetchedAt: string;
  /** True when the source failed and the last good snapshot is being served. */
  readonly stale: boolean;
}

export type GetResultsOptions = GetLatestOptions;

/**
 * Fetches the latest snapshot. Concurrent calls share one request to the source, and
 * when the source fails the last good snapshot is returned flagged as stale.
 */
export class GetResults {
  private readonly latest: GetLatest<ElectionSnapshot>;

  constructor(source: ResultsSource, options: GetResultsOptions = {}) {
    this.latest = new GetLatest(() => source.fetchSnapshot(), options);
  }

  async execute(): Promise<ResultsSnapshot> {
    const { value, fetchedAt, stale } = await this.latest.execute();
    return { ...value, fetchedAt, stale };
  }
}
