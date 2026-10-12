import { describe, expect, it } from 'vitest';
import { outlook } from '../src';
import { makeTally } from './factories';

const country = { kind: 'country' } as const;

describe('outlook', () => {
  it('estimates the remaining valid votes from the pending sections', () => {
    const result = outlook(
      makeTally(country, { '13': 60, '22': 40 }, { sections: { total: 100, counted: 25 } }),
    );
    expect(result?.leader.number).toBe('13');
    expect(result?.lead).toBe(20);
    expect(result?.remaining).toBe(300);
  });

  it('reports the share of the remaining votes the runner-up needs', () => {
    const result = outlook(
      makeTally(country, { '13': 60, '22': 40 }, { sections: { total: 100, counted: 25 } }),
    );
    // 20 behind with 300 left: needs (300 + 20) / 2 = 160 of 300.
    expect(result?.runnerUpNeeds).toBeCloseTo(53.33, 2);
    expect(result?.decided).toBe(false);
  });

  it('is decided when the lead exceeds every voter not yet counted', () => {
    const result = outlook(
      makeTally(
        country,
        { '13': 900, '22': 100 },
        { electorate: 2000, turnout: 1500, sections: { total: 100, counted: 75 } },
      ),
    );
    expect(result?.decided).toBe(true);
  });

  it('bounds what is left by the electorate of the sections still to count', () => {
    // 200 voters in the pending sections cannot make up a lead of 300.
    const result = outlook(
      makeTally(
        country,
        { '13': 550, '22': 250 },
        {
          electorate: 2000,
          countedElectorate: 1800,
          turnout: 820,
          sections: { total: 100, counted: 90 },
        },
      ),
    );
    expect(result?.decided).toBe(true);
  });

  it('is decided once every section is counted', () => {
    const result = outlook(
      makeTally(country, { '13': 51, '22': 49 }, { sections: { total: 10, counted: 10 } }),
    );
    expect(result?.decided).toBe(true);
    expect(result?.runnerUpNeeds).toBeUndefined();
  });

  it('is not decided on a tie', () => {
    const result = outlook(
      makeTally(country, { '13': 50, '22': 50 }, { sections: { total: 10, counted: 10 } }),
    );
    expect(result?.decided).toBe(false);
  });

  it('is undefined without two candidates with votes', () => {
    expect(outlook(makeTally(country, { '13': 0, '22': 0 }))).toBeUndefined();
    expect(outlook(makeTally(country, { '13': 10 }))).toBeUndefined();
  });
});
