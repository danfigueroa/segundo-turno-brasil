import { describe, expect, it } from 'vitest';
import { countedElectorateOf } from '../src';
import { makeTally } from './factories';

describe('countedElectorateOf', () => {
  it('is the electorate of the counted sections', () => {
    const tally = makeTally({ kind: 'country' }, { '13': 1 }, { countedElectorate: 7 });
    expect(countedElectorateOf(tally)).toBe(7);
  });

  it('falls back to the whole electorate', () => {
    const tally = makeTally({ kind: 'country' }, { '13': 1 }, { electorate: 9 });
    expect(countedElectorateOf(tally)).toBe(9);
  });
});
