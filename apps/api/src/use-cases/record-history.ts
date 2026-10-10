import { historyEntryOf } from '@stb/domain';
import type { HistoryStore } from '../ports/history-store';
import type { ElectionSnapshot, ResultsSource } from '../ports/results-source';

export interface RecordHistoryOptions {
  readonly onError?: (error: unknown) => void;
}

/**
 * Records a point of the count curve whenever the national count moves forward. Best
 * effort: a failing store is reported but never breaks the results.
 */
export class RecordHistory {
  /** Highest national count this instance already recorded, to skip store round trips. */
  private lastCounted = 0;

  constructor(
    private readonly store: HistoryStore,
    private readonly options: RecordHistoryOptions = {},
  ) {}

  async execute(snapshot: ElectionSnapshot): Promise<void> {
    const entry = historyEntryOf(snapshot);
    const counted = entry.samples.BR.counted;
    if (counted <= this.lastCounted) return;
    try {
      await this.store.append(entry);
      this.lastCounted = counted;
    } catch (error) {
      this.options.onError?.(error);
    }
  }
}

/** Wraps a source so every snapshot it returns is also recorded in the history. */
export function recordingSource(source: ResultsSource, history: RecordHistory): ResultsSource {
  return {
    async fetchSnapshot() {
      const snapshot = await source.fetchSnapshot();
      await history.execute(snapshot);
      return snapshot;
    },
  };
}
