import { describe, expect, it } from 'vitest';
import { MemoryHistoryStore } from '../../src/adapters/history/memory-history-store';
import { historyEntry } from '../helpers';

describe('MemoryHistoryStore', () => {
  it('starts empty and keeps appended entries in order', async () => {
    const store = new MemoryHistoryStore();
    expect(await store.read()).toEqual([]);
    await store.append(historyEntry(10));
    await store.append(historyEntry(20));
    expect((await store.read()).map((e) => e.samples.BR.counted)).toEqual([10, 20]);
  });

  it('skips entries that do not move the count forward', async () => {
    const store = new MemoryHistoryStore();
    await store.append(historyEntry(10));
    await store.append(historyEntry(10));
    expect(await store.read()).toHaveLength(1);
  });
});
