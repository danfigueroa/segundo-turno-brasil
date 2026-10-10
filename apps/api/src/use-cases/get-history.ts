import type { HistoryEntry } from '@stb/domain';
import type { HistoryStore } from '../ports/history-store';
import { GetLatest, type GetLatestOptions, type Latest } from './get-latest';

/** Latest count history, with the same sharing and stale fallback as the results. */
export class GetHistory {
  private readonly latest: GetLatest<readonly HistoryEntry[]>;

  constructor(store: HistoryStore, options: GetLatestOptions = {}) {
    this.latest = new GetLatest(() => store.read(), options);
  }

  execute(): Promise<Latest<readonly HistoryEntry[]>> {
    return this.latest.execute();
  }
}
