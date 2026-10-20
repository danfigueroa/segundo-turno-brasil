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
  /**
   * A good value younger than this is returned without asking the source again: CDN
   * misses from several regions in a row then cost one source request (ADR 0031).
   */
  readonly reuseForMs?: number;
}

/**
 * Fetches the latest value from a source. Concurrent calls share one request, a recent
 * good value is reused, and when the source fails the last good value is returned
 * flagged as stale.
 */
export class GetLatest<T> {
  private lastGood: Latest<T> | undefined;
  private inFlight: Promise<Latest<T>> | undefined;

  constructor(
    private readonly fetchValue: () => Promise<T>,
    private readonly options: GetLatestOptions = {},
  ) {}

  execute(): Promise<Latest<T>> {
    const recent = this.recent();
    if (recent) return Promise.resolve(recent);
    this.inFlight ??= this.refresh().finally(() => {
      this.inFlight = undefined;
    });
    return this.inFlight;
  }

  /** The last good value, while younger than `reuseForMs`. */
  private recent(): Latest<T> | undefined {
    const { reuseForMs = 0 } = this.options;
    if (!this.lastGood || reuseForMs <= 0) return undefined;
    const age = this.now().getTime() - Date.parse(this.lastGood.fetchedAt);
    return age < reuseForMs ? this.lastGood : undefined;
  }

  private now(): Date {
    return this.options.now?.() ?? new Date();
  }

  private async refresh(): Promise<Latest<T>> {
    try {
      const value = await this.fetchValue();
      const fetchedAt = this.now().toISOString();
      this.lastGood = { value, fetchedAt, stale: false };
      return this.lastGood;
    } catch (error) {
      this.options.onError?.(error);
      if (!this.lastGood) throw error;
      return { ...this.lastGood, stale: true };
    }
  }
}
