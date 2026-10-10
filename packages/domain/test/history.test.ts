import { describe, expect, it } from 'vitest';
import {
  appendEntry,
  historyEntryOf,
  paceOf,
  regionSeriesOf,
  sampleOf,
  seriesOf,
  STATE_CODES,
  type CountPoint,
  type HistoryEntry,
  type StateCode,
  type Tally,
} from '../src';
import { makeTally } from './factories';

function snapshotAt(counted: number, at = '2026-10-25T18:00:00-03:00') {
  const sections = { total: 100, counted };
  const states = Object.fromEntries(
    STATE_CODES.map((code) => [
      code,
      makeTally({ kind: 'state', code }, { '13': counted, '22': 1 }, { sections }),
    ]),
  ) as Record<StateCode, Tally>;
  return {
    country: makeTally({ kind: 'country' }, { '13': 10, '22': 5 }, { sections, updatedAt: at }),
    states,
    abroad: makeTally({ kind: 'abroad' }, { '13': 1 }, { sections }),
  };
}

describe('sampleOf', () => {
  it('keeps the sections and the votes by ballot number', () => {
    const tally = makeTally({ kind: 'country' }, { '13': 7, '22': 3 });
    expect(sampleOf(tally)).toEqual({ counted: 50, total: 100, votes: { '13': 7, '22': 3 } });
  });
});

describe('historyEntryOf', () => {
  it('samples Brazil, abroad and every state at the national totalization time', () => {
    const entry = historyEntryOf(snapshotAt(10, '2026-10-25T18:05:00-03:00'));
    expect(entry.at).toBe('2026-10-25T18:05:00-03:00');
    expect(entry.samples.BR.votes).toEqual({ '13': 10, '22': 5 });
    expect(entry.samples.ZZ.votes).toEqual({ '13': 1 });
    expect(Object.keys(entry.samples)).toHaveLength(29);
  });
});

describe('appendEntry', () => {
  const first = historyEntryOf(snapshotAt(10));

  it('appends when the national count moved forward', () => {
    expect(appendEntry([first], historyEntryOf(snapshotAt(20)))).toHaveLength(2);
  });

  it('ignores repeated or older counts', () => {
    const entries = [first];
    expect(appendEntry(entries, historyEntryOf(snapshotAt(10)))).toBe(entries);
    expect(appendEntry(entries, historyEntryOf(snapshotAt(5)))).toBe(entries);
  });

  it('ignores snapshots before the count starts', () => {
    expect(appendEntry([], historyEntryOf(snapshotAt(0)))).toEqual([]);
  });
});

describe('seriesOf / regionSeriesOf', () => {
  const entries: HistoryEntry[] = [historyEntryOf(snapshotAt(10)), historyEntryOf(snapshotAt(20))];

  it('extracts the curve of one scope', () => {
    expect(seriesOf(entries, 'SP').map((p) => p.votes['13'])).toEqual([10, 20]);
  });

  it('sums the states of a region at each moment', () => {
    // South: PR, RS, SC.
    const [point] = regionSeriesOf(entries, 'S');
    expect(point).toEqual({
      at: '2026-10-25T18:00:00-03:00',
      counted: 30,
      total: 300,
      votes: { '13': 30, '22': 3 },
    });
  });
});

describe('paceOf', () => {
  const point = (minute: number, counted: number): CountPoint => ({
    at: new Date(Date.UTC(2026, 9, 25, 21, minute)).toISOString(),
    counted,
    total: 1000,
    votes: {},
  });

  it('measures sections per minute over the window and projects the end', () => {
    const pace = paceOf([point(0, 0), point(10, 100), point(20, 300)], 10);
    expect(pace?.sectionsPerMinute).toBe(20);
    expect(pace?.remainingSections).toBe(700);
    expect(pace?.eta).toBe('2026-10-25T21:55:00.000Z');
  });

  it('falls back to the previous point when the window is empty', () => {
    expect(paceOf([point(0, 0), point(30, 300)], 10)?.sectionsPerMinute).toBe(10);
  });

  it('has no estimate when the count is done or stalled', () => {
    expect(paceOf([point(0, 1000), point(5, 1000)])?.eta).toBeUndefined();
    expect(paceOf([point(0, 10), point(5, 10)])?.eta).toBeUndefined();
  });

  it('needs at least two points', () => {
    expect(paceOf([point(0, 10)])).toBeUndefined();
  });
});
