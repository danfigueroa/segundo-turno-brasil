export interface Latest<T> {
  readonly value: T;
  /** When the value was fetched from the source. */
  readonly fetchedAt: string;
  /** True when the source failed and the last good value is being served. */
  readonly stale: boolean;
}

export interface GetLatestOptions {
  readonly now?: () => Date;
  readonly onError?: (error: unknown) => void;
}

/**
 * Fetches the latest value from a source. Concurrent calls share one request, and when
 * the source fails the last good value is returned flagged as stale.
 */
export class GetLatest<T> {
  private lastGood: Latest<T> | undefined;
  private inFlight: Promise<Latest<T>> | undefined;

  constructor(
    private readonly fetchValue: () => Promise<T>,
    private readonly options: GetLatestOptions = {},
  ) {}

  execute(): Promise<Latest<T>> {
    this.inFlight ??= this.refresh().finally(() => {
      this.inFlight = undefined;
    });
    return this.inFlight;
  }

  private async refresh(): Promise<Latest<T>> {
    try {
      const value = await this.fetchValue();
      const fetchedAt = (this.options.now?.() ?? new Date()).toISOString();
      this.lastGood = { value, fetchedAt, stale: false };
      return this.lastGood;
    } catch (error) {
      this.options.onError?.(error);
      if (!this.lastGood) throw error;
      return { ...this.lastGood, stale: true };
    }
  }
}
