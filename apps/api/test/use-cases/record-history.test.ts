import { describe, expect, it, vi } from 'vitest';
import { MemoryHistoryStore } from '../../src/adapters/history/memory-history-store';
import { TseResultsSource } from '../../src/adapters/tse/tse-results-source';
import { createFixtureLoader } from '../../src/adapters/tse/fixture-loader';
import type { HistoryStore } from '../../src/ports/history-store';
import { RecordHistory, recordingSource } from '../../src/use-cases/record-history';
import { FIRST_ROUND_2026 } from '../helpers';

const source = new TseResultsSource(createFixtureLoader(FIRST_ROUND_2026));

describe('RecordHistory', () => {
  it('records a snapshot of every scope', async () => {
    const store = new MemoryHistoryStore();
    await new RecordHistory(store).execute(await source.fetchSnapshot());
    const [entry] = await store.read();
    expect(entry?.samples.BR.counted).toBeGreaterThan(0);
    expect(entry?.samples.SP.total).toBeGreaterThan(0);
  });

  it('skips the store when the count did not move', async () => {
    const store: HistoryStore = { read: vi.fn(), append: vi.fn().mockResolvedValue(undefined) };
    const record = new RecordHistory(store);
    const snapshot = await source.fetchSnapshot();
    await record.execute(snapshot);
    await record.execute(snapshot);
    expect(store.append).toHaveBeenCalledOnce();
  });

  it('reports store failures without throwing, and tries again next time', async () => {
    const onError = vi.fn();
    const append = vi
      .fn()
      .mockRejectedValueOnce(new Error('blob down'))
      .mockResolvedValue(undefined);
    const record = new RecordHistory({ read: vi.fn(), append }, { onError });
    const snapshot = await source.fetchSnapshot();
    await expect(record.execute(snapshot)).resolves.toBeUndefined();
    await record.execute(snapshot);
    expect(onError).toHaveBeenCalledOnce();
    expect(append).toHaveBeenCalledTimes(2);
  });
});

describe('recordingSource', () => {
  it('returns the snapshot and records it', async () => {
    const store = new MemoryHistoryStore();
    const snapshot = await recordingSource(source, new RecordHistory(store)).fetchSnapshot();
    expect(snapshot.country.candidates.length).toBeGreaterThan(0);
    expect(await store.read()).toHaveLength(1);
  });
});
