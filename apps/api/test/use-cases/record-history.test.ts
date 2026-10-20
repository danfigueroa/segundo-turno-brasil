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

  it('writes one snapshot at a time', async () => {
    let writing = 0;
    let overlapped = false;
    const append = vi.fn(async () => {
      writing += 1;
      overlapped ||= writing > 1;
      await new Promise((resolve) => setTimeout(resolve, 5));
      writing -= 1;
    });
    const record = new RecordHistory({ read: vi.fn(), append });
    const snapshot = await source.fetchSnapshot();
    const later = {
      ...snapshot,
      country: {
        ...snapshot.country,
        sections: { ...snapshot.country.sections, counted: snapshot.country.sections.counted + 1 },
      },
    };
    await Promise.all([record.execute(snapshot), record.execute(later)]);
    expect(append).toHaveBeenCalledTimes(2);
    expect(overlapped).toBe(false);
  });
});

describe('recordingSource', () => {
  it('returns the snapshot and hands its recording to the scheduler', async () => {
    const store = new MemoryHistoryStore();
    const tasks: Promise<void>[] = [];
    const recording = recordingSource(source, new RecordHistory(store), (task) => tasks.push(task));
    const snapshot = await recording.fetchSnapshot();
    expect(snapshot.country.candidates.length).toBeGreaterThan(0);
    expect(tasks).toHaveLength(1);
    await Promise.all(tasks);
    expect(await store.read()).toHaveLength(1);
  });

  it('does not wait for a slow store', async () => {
    const append = vi.fn(() => new Promise<void>(() => undefined));
    const recording = recordingSource(
      source,
      new RecordHistory({ read: vi.fn(), append }),
      () => undefined,
    );
    await expect(recording.fetchSnapshot()).resolves.toBeDefined();
  });
});
