import { STATE_CODES, type Tally } from '@stb/domain';
import { describe, expect, it } from 'vitest';
import { resultsResponseSchema, tallySchema } from '../src';

const tally: Tally = {
  scope: { kind: 'country' },
  candidates: [{ number: '13', name: 'A', party: 'PA', votes: 10, share: 100 }],
  sections: { total: 2, counted: 1 },
  electorate: 20,
  turnout: 12,
  votes: { valid: 10, blank: 1, null: 1 },
  updatedAt: '2026-10-25T18:00:00-03:00',
};

describe('tallySchema', () => {
  it('accepts a valid tally', () => {
    expect(tallySchema.parse(tally)).toEqual(tally);
  });

  it('rejects negative counts', () => {
    expect(tallySchema.safeParse({ ...tally, electorate: -1 }).success).toBe(false);
  });

  it('rejects unknown state codes', () => {
    const scope = { kind: 'state', code: 'ZZ' };
    expect(tallySchema.safeParse({ ...tally, scope }).success).toBe(false);
  });
});

describe('resultsResponseSchema', () => {
  const states = Object.fromEntries(STATE_CODES.map((code) => [code, tally]));
  const response = {
    country: tally,
    states,
    abroad: tally,
    fetchedAt: '2026-10-25T21:00:00Z',
    stale: false,
  };

  it('accepts a complete snapshot', () => {
    expect(resultsResponseSchema.safeParse(response).success).toBe(true);
  });

  it('requires all 27 states', () => {
    const incomplete = { ...states };
    delete incomplete.SP;
    expect(resultsResponseSchema.safeParse({ ...response, states: incomplete }).success).toBe(
      false,
    );
  });
});
