import { afterEach, describe, expect, it } from 'vitest';
import { resultsResponse, tally } from '../../../test/fixtures';
import { liveSeries, recordLive, resetLive } from './live-history';

afterEach(resetLive);

const snapshot = (counted: number) => {
  const base = resultsResponse();
  return { ...base, country: tally({ kind: 'country' }, counted * 10, counted * 9, counted) };
};

describe('live history', () => {
  it('collects the polled runoff snapshots and ends with the one on screen', () => {
    recordLive(snapshot(10));
    recordLive(snapshot(20));
    const current = snapshot(30);
    expect(liveSeries(current, { kind: 'country' }).map((p) => p.counted)).toEqual([10, 20, 30]);
  });

  it('sums a region from its states', () => {
    recordLive(snapshot(10));
    const [point] = liveSeries(snapshot(20), { kind: 'region', code: 'S' });
    expect(point).toMatchObject({ counted: 150, total: 300 });
  });

  it('ignores the first round', () => {
    recordLive({ ...snapshot(10), round: 1 });
    expect(liveSeries(snapshot(20), { kind: 'country' })).toHaveLength(1);
  });
});
