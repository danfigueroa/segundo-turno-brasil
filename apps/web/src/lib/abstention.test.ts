import { describe, expect, it } from 'vitest';
import { tally } from '../../test/fixtures';
import { abstentionOf, abstentionStep } from './abstention';

describe('abstentionOf', () => {
  it('is measured against the electorate of the counted sections', () => {
    const base = tally({ kind: 'country' }, 450, 470);
    expect(abstentionOf({ ...base, electorate: 2000, countedElectorate: 1000, turnout: 780 })).toBe(
      22,
    );
  });

  it('is unknown before any section is counted', () => {
    expect(abstentionOf(tally({ kind: 'country' }, 0, 0, 0))).toBeUndefined();
  });
});

describe('abstentionStep', () => {
  it('bins abstention in five steps', () => {
    expect([10, 15, 19.9, 20, 27, 30, 45].map(abstentionStep)).toEqual([1, 2, 2, 3, 4, 5, 5]);
  });
});
