import { describe, expect, it, vi } from 'vitest';
import { MemoryHistoryStore } from '../../src/adapters/history/memory-history-store';
import { GetHistory } from '../../src/use-cases/get-history';
import { historyEntry } from '../helpers';

const now = () => new Date('2026-10-25T21:00:00Z');

describe('GetHistory', () => {
  it('returns the stored entries with the read time', async () => {
    const store = new MemoryHistoryStore();
    await store.append(historyEntry(10));
    const result = await new GetHistory(store, { now }).execute();
    expect(result).toMatchObject({ fetchedAt: '2026-10-25T21:00:00.000Z', stale: false });
    expect(result.value).toHaveLength(1);
  });

  it('serves the last good history as stale when the store fails', async () => {
    const read = vi
      .fn()
      .mockResolvedValueOnce([historyEntry(10)])
      .mockRejectedValueOnce(new Error('blob down'));
    const useCase = new GetHistory({ read, append: vi.fn() }, { now });
    await useCase.execute();
    const result = await useCase.execute();
    expect(result.stale).toBe(true);
    expect(result.value).toHaveLength(1);
  });
});
