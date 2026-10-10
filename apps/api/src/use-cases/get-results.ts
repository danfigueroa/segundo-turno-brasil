import type { ElectionSnapshot, ResultsSource } from '../ports/results-source';

export interface ResultsSnapshot extends ElectionSnapshot {
  /** When the snapshot was fetched from the source. */
  readonly fetchedAt: string;
  /** True when the source failed and the last good snapshot is being served. */
  readonly stale: boolean;
}

export interface GetResultsOptions {
  readonly now?: () => Date;
  readonly onError?: (error: unknown) => void;
}

/**
 * Fetches the latest snapshot. Concurrent calls share one request to the source, and
 * when the source fails the last good snapshot is returned flagged as stale.
 */
export class GetResults {
  private lastGood: ResultsSnapshot | undefined;
  private inFlight: Promise<ResultsSnapshot> | undefined;

  constructor(
    private readonly source: ResultsSource,
    private readonly options: GetResultsOptions = {},
  ) {}

  execute(): Promise<ResultsSnapshot> {
    this.inFlight ??= this.refresh().finally(() => {
      this.inFlight = undefined;
    });
    return this.inFlight;
  }

  private async refresh(): Promise<ResultsSnapshot> {
    try {
      const snapshot = await this.source.fetchSnapshot();
      const fetchedAt = (this.options.now?.() ?? new Date()).toISOString();
      this.lastGood = { ...snapshot, fetchedAt, stale: false };
      return this.lastGood;
    } catch (error) {
      this.options.onError?.(error);
      if (!this.lastGood) throw error;
      return { ...this.lastGood, stale: true };
    }
  }
}
