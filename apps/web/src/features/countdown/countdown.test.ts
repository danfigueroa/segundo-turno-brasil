import { describe, expect, it } from 'vitest';
import { countdownParts, RUNOFF_COUNT_START } from './countdown';

describe('countdownParts', () => {
  it('splits the time left into padded units', () => {
    const now = Date.parse('2026-10-10T08:58:57-03:00');
    expect(countdownParts(RUNOFF_COUNT_START, now).map((p) => p.value)).toEqual([
      '15',
      '08',
      '01',
      '03',
    ]);
  });

  it('stops at zero once the count has started', () => {
    const now = Date.parse('2026-10-25T18:00:00-03:00');
    expect(countdownParts(RUNOFF_COUNT_START, now).map((p) => p.value)).toEqual([
      '00',
      '00',
      '00',
      '00',
    ]);
  });
});
