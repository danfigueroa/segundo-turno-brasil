import { describe, expect, it } from 'vitest';
import { REGION_CODES, STATE_CODES, isStateCode, statesInRegion } from '../src';

describe('states', () => {
  it('lists the 27 federative units', () => {
    expect(STATE_CODES).toHaveLength(27);
  });

  it('assigns every state to exactly one region', () => {
    const all = REGION_CODES.flatMap(statesInRegion);
    expect(all.sort()).toEqual([...STATE_CODES].sort());
  });

  it('validates state codes', () => {
    expect(isStateCode('SP')).toBe(true);
    expect(isStateCode('ZZ')).toBe(false);
    expect(isStateCode('toString')).toBe(false);
  });
});
