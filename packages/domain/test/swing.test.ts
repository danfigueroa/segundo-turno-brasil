import { describe, expect, it } from 'vitest';
import { swing } from '../src';
import { makeTally } from './factories';

const country = { kind: 'country' } as const;

describe('swing', () => {
  it('reports the change in share and votes of each candidate', () => {
    const before = makeTally(country, { '13': 40, '22': 35, '15': 25 });
    const after = makeTally(country, { '13': 60, '22': 40 });
    expect(swing(before, after)).toEqual([
      { number: '13', share: 20, votes: 20 },
      { number: '22', share: 5, votes: 5 },
    ]);
  });

  it('compares a candidate missing before against zero', () => {
    const before = makeTally(country, { '13': 10 });
    const after = makeTally(country, { '13': 5, '22': 5 });
    expect(swing(before, after).find((s) => s.number === '22')).toEqual({
      number: '22',
      share: 50,
      votes: 5,
    });
  });
});
