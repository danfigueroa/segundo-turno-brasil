import { describe, expect, it } from 'vitest';
import { aggregate, aggregateRegion } from '../src';
import { makeTally } from './factories';

describe('aggregate', () => {
  const sp = makeTally({ kind: 'state', code: 'SP' }, { '13': 30, '22': 70 });
  const rj = makeTally(
    { kind: 'state', code: 'RJ' },
    { '13': 70, '22': 30 },
    { updatedAt: '2026-10-25T18:05:00-03:00' },
  );

  it('sums votes and recomputes shares', () => {
    const total = aggregate({ kind: 'region', code: 'SE' }, [sp, rj]);
    expect(total.candidates.map((c) => [c.number, c.votes, c.share])).toEqual([
      ['13', 100, 50],
      ['22', 100, 50],
    ]);
  });

  it('sums sections, electorate and vote kinds', () => {
    const total = aggregate({ kind: 'region', code: 'SE' }, [sp, rj]);
    expect(total.sections).toEqual({ total: 200, counted: 100 });
    expect(total.votes).toEqual({ valid: 200, blank: 8, null: 12 });
    expect(total.electorate).toBe(400);
    expect(total.turnout).toBe(220);
  });

  it('keeps the most recent update time', () => {
    expect(aggregate({ kind: 'country' }, [sp, rj]).updatedAt).toBe('2026-10-25T18:05:00-03:00');
  });
});

describe('aggregateRegion', () => {
  it('only includes states of the requested region', () => {
    const states = {
      SP: makeTally({ kind: 'state', code: 'SP' }, { '13': 10 }),
      BA: makeTally({ kind: 'state', code: 'BA' }, { '13': 99 }),
    };
    const southeast = aggregateRegion('SE', states);
    expect(southeast.scope).toEqual({ kind: 'region', code: 'SE' });
    expect(southeast.candidates[0]?.votes).toBe(10);
  });
});
