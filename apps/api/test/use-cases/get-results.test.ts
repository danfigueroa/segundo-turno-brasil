import { describe, expect, it, vi } from 'vitest';
import type { ElectionSnapshot, ResultsSource } from '../../src/ports/results-source';
import { GetResults } from '../../src/use-cases/get-results';

const snapshot = { country: {}, states: {}, abroad: {} } as unknown as ElectionSnapshot;
const now = () => new Date('2026-10-25T21:00:00Z');

function sourceFrom(...results: (ElectionSnapshot | Error)[]): ResultsSource {
  const queue = [...results];
  return {
    fetchSnapshot: vi.fn(async () => {
      const next = queue.shift();
      if (next instanceof Error || next === undefined) throw next ?? new Error('empty');
      return next;
    }),
  };
}

describe('GetResults', () => {
  it('returns a fresh snapshot with the fetch time', async () => {
    const result = await new GetResults(sourceFrom(snapshot), { now }).execute();
    expect(result).toMatchObject({ fetchedAt: '2026-10-25T21:00:00.000Z', stale: false });
  });

  it('serves the last good snapshot as stale when the source fails', async () => {
    const onError = vi.fn();
    const useCase = new GetResults(sourceFrom(snapshot, new Error('TSE down')), { now, onError });
    await useCase.execute();
    const result = await useCase.execute();
    expect(result.stale).toBe(true);
    expect(result.fetchedAt).toBe('2026-10-25T21:00:00.000Z');
    expect(onError).toHaveBeenCalledOnce();
  });

  it('fails when there is no previous snapshot', async () => {
    const useCase = new GetResults(sourceFrom(new Error('TSE down')));
    await expect(useCase.execute()).rejects.toThrow('TSE down');
  });

  it('shares one source request between concurrent calls', async () => {
    const source = sourceFrom(snapshot);
    const useCase = new GetResults(source);
    await Promise.all([useCase.execute(), useCase.execute()]);
    expect(source.fetchSnapshot).toHaveBeenCalledOnce();
  });

  it('reuses a recent good snapshot without asking the source', async () => {
    let time = Date.parse('2026-10-25T21:00:00Z');
    const clock = () => new Date(time);
    const source = sourceFrom(snapshot, snapshot);
    const useCase = new GetResults(source, { now: clock, reuseForMs: 10_000 });
    await useCase.execute();
    time += 9_999;
    expect((await useCase.execute()).fetchedAt).toBe('2026-10-25T21:00:00.000Z');
    expect(source.fetchSnapshot).toHaveBeenCalledOnce();
    time += 1;
    expect((await useCase.execute()).fetchedAt).toBe('2026-10-25T21:00:10.000Z');
    expect(source.fetchSnapshot).toHaveBeenCalledTimes(2);
  });

  it('does not reuse a stale snapshot', async () => {
    let time = Date.parse('2026-10-25T21:00:00Z');
    const clock = () => new Date(time);
    const source = sourceFrom(snapshot, new Error('TSE down'), snapshot);
    const useCase = new GetResults(source, { now: clock, reuseForMs: 10_000 });
    await useCase.execute();
    time += 10_000;
    expect((await useCase.execute()).stale).toBe(true);
    time += 1;
    expect((await useCase.execute()).stale).toBe(false);
    expect(source.fetchSnapshot).toHaveBeenCalledTimes(3);
  });
});
