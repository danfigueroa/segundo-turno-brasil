import { appendEntry, type HistoryEntry } from '@stb/domain';
import type { HistoryStore } from '../../ports/history-store';

/**
 * Keeps the history in the process memory: enough for the dev server and simulation,
 * but each serverless instance would see only its own entries.
 */
export class MemoryHistoryStore implements HistoryStore {
  private entries: readonly HistoryEntry[] = [];

  read(): Promise<readonly HistoryEntry[]> {
    return Promise.resolve(this.entries);
  }

  append(entry: HistoryEntry): Promise<void> {
    this.entries = appendEntry(this.entries, entry);
    return Promise.resolve();
  }
}
