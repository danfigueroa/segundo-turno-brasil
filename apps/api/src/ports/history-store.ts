import type { HistoryEntry } from '@stb/domain';

/** Port: where the runoff count history is kept between function executions. */
export interface HistoryStore {
  /** Every recorded entry, oldest first. */
  read(): Promise<readonly HistoryEntry[]>;
  /** Records an entry, unless the stored count is already at or past it. */
  append(entry: HistoryEntry): Promise<void>;
}
