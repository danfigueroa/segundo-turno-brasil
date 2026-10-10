import { describe, expect, it } from 'vitest';
import { emphasisOf } from './emphasis';

describe('emphasisOf', () => {
  it('keeps everything in full color for the country', () => {
    expect(emphasisOf('SP', { kind: 'country' })).toBe('full');
    expect(emphasisOf('abroad', { kind: 'country' })).toBe('full');
  });

  it('fades states outside the selected region', () => {
    expect(emphasisOf('BA', { kind: 'region', code: 'NE' })).toBe('full');
    expect(emphasisOf('SP', { kind: 'region', code: 'NE' })).toBe('far');
  });

  it('half-fades neighbors in the region of the selected state', () => {
    const selection = { kind: 'state', code: 'SP' } as const;
    expect(emphasisOf('SP', selection)).toBe('full');
    expect(emphasisOf('RJ', selection)).toBe('near');
    expect(emphasisOf('BA', selection)).toBe('far');
    expect(emphasisOf('abroad', selection)).toBe('near');
  });

  it('fades every state when abroad is selected', () => {
    expect(emphasisOf('SP', { kind: 'abroad' })).toBe('far');
    expect(emphasisOf('abroad', { kind: 'abroad' })).toBe('full');
  });
});
