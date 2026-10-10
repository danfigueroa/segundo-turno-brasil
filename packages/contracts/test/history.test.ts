import { describe, expect, it } from 'vitest';
import { historyResponseSchema } from '../src';

const response = {
  scope: { kind: 'region', code: 'NE' },
  points: [
    {
      at: '2026-10-25T17:05:00-03:00',
      counted: 1200,
      total: 120000,
      votes: { '13': 60000, '22': 40000 },
    },
  ],
  fetchedAt: '2026-10-25T20:06:00.000Z',
  stale: false,
};

describe('historyResponseSchema', () => {
  it('accepts the count curve of a scope', () => {
    expect(historyResponseSchema.parse(response)).toEqual(response);
  });

  it('rejects points without a valid timestamp or with negative votes', () => {
    const [point] = response.points;
    expect(
      historyResponseSchema.safeParse({ ...response, points: [{ ...point, at: '17:05' }] }).success,
    ).toBe(false);
    expect(
      historyResponseSchema.safeParse({ ...response, points: [{ ...point, votes: { '13': -1 } }] })
        .success,
    ).toBe(false);
  });
});
