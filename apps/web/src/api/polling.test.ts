import { describe, expect, it } from 'vitest';
import { POLL_INTERVAL_MS, SLOW_POLL_INTERVAL_MS, pollIntervalOf, sectionsOf } from './polling';

const before = Date.parse('2026-10-25T16:00:00-03:00');
const during = Date.parse('2026-10-25T18:00:00-03:00');

describe('pollIntervalOf', () => {
  it('stops once every section is counted', () => {
    expect(pollIntervalOf({ total: 10, counted: 10 }, { now: during })).toBe(false);
  });

  it('polls every minute while the count runs', () => {
    expect(pollIntervalOf({ total: 10, counted: 4 }, { now: during })).toBe(POLL_INTERVAL_MS);
  });

  it('polls slowly before the count starts', () => {
    expect(pollIntervalOf({ total: 10, counted: 0 }, { now: before })).toBe(SLOW_POLL_INTERVAL_MS);
  });

  it('polls every minute from 17h even before the first batch', () => {
    expect(pollIntervalOf({ total: 10, counted: 0 }, { now: during })).toBe(POLL_INTERVAL_MS);
  });

  it('polls slowly when asked to', () => {
    expect(pollIntervalOf({ total: 10, counted: 4 }, { slow: true, now: during })).toBe(
      SLOW_POLL_INTERVAL_MS,
    );
  });

  it('keeps polling without data or without sections', () => {
    expect(pollIntervalOf(undefined, { now: during })).toBe(POLL_INTERVAL_MS);
    expect(pollIntervalOf({ total: 0, counted: 0 }, { now: during })).toBe(POLL_INTERVAL_MS);
  });
});

describe('sectionsOf', () => {
  it('adds up the sections of every place', () => {
    expect(
      sectionsOf([{ sections: { total: 3, counted: 1 } }, { sections: { total: 5, counted: 5 } }]),
    ).toEqual({ total: 8, counted: 6 });
  });
});
