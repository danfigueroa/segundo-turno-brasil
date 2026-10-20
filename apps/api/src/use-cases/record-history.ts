import { historyEntryOf } from '@stb/domain';
import type { HistoryStore } from '../ports/history-store';
import type { ElectionSnapshot, ResultsSource } from '../ports/results-source';

export interface RecordHistoryOptions {
  readonly onError?: (error: unknown) => void;
}

/**
 * Records a point of the count curve whenever the national count moves forward. Best
 * effort: a failing store is reported but never breaks the results. Calls run one after
 * the other, so two refreshes never write the store at the same time.
 */
export class RecordHistory {
  /** Highest national count this instance already recorded, to skip store round trips. */
  private lastCounted = 0;
  private queue: Promise<void> = Promise.resolve();

  constructor(
    private readonly store: HistoryStore,
    private readonly options: RecordHistoryOptions = {},
  ) {}

  /** Resolves once the snapshot is recorded (or skipped); never rejects. */
  execute(snapshot: ElectionSnapshot): Promise<void> {
    this.queue = this.queue.then(() => this.record(snapshot));
    return this.queue;
  }

  private async record(snapshot: ElectionSnapshot): Promise<void> {
    try {
      const entry = historyEntryOf(snapshot);
      const counted = entry.samples.BR.counted;
      if (counted <= this.lastCounted) return;
      await this.store.append(entry);
      this.lastCounted = counted;
    } catch (error) {
      this.options.onError?.(error);
    }
  }
}

/** Runs a background task, such as Vercel's `waitUntil` (after the response is sent). */
export type Schedule = (task: Promise<void>) => void;

/**
 * Wraps a source so every snapshot it returns is also recorded in the history. The
 * recording is handed to `schedule` instead of awaited, so a slow store never delays the
 * results (ADR 0011).
 */
export function recordingSource(
  source: ResultsSource,
  history: RecordHistory,
  schedule: Schedule,
): ResultsSource {
  return {
    async fetchSnapshot() {
      const snapshot = await source.fetchSnapshot();
      schedule(history.execute(snapshot));
      return snapshot;
    },
  };
}
