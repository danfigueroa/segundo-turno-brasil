import { describe, expect, it } from 'vitest';
import { compactPath } from './compact-path';

/** Absolute points of a path written by `compactPath` (`m`, `l` and `z` only). */
function pointsOf(d: string): string[] {
  const points: string[] = [];
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  for (const [, command, args] of d.matchAll(/([mlz])([^mlz]*)/g)) {
    if (command === 'z') {
      points.push('Z');
      x = startX;
      y = startY;
      continue;
    }
    const numbers = (args ?? '').match(/-?\d+/g)?.map(Number) ?? [];
    for (let i = 0; i < numbers.length; i += 2) {
      x += numbers[i] ?? 0;
      y += numbers[i + 1] ?? 0;
      points.push(`${command === 'm' && i === 0 ? 'M' : 'L'}${x},${y}`);
      if (command === 'm' && i === 0) {
        startX = x;
        startY = y;
      }
    }
  }
  return points;
}

describe('compactPath', () => {
  it('writes relative commands, leaving out repeated letters', () => {
    expect(compactPath('M10,20L13,20L13,25L10,25Z')).toBe('m10,20l3,0 0,5-3,0z');
  });

  it('drops points repeated by the rounding', () => {
    expect(compactPath('M10,20L10,20L12,22L12,22Z')).toBe('m10,20l2,2z');
  });

  it('moves relative to where the last subpath closed', () => {
    const d = 'M10,20L12,22L8,24ZM100,200L90,210L95,190Z';
    expect(compactPath(d)).toBe('m10,20l2,2-4,2zm90,180l-10,10 5-20z');
  });

  it('draws exactly the same points', () => {
    const d = 'M512,-30L498,-7L498,-7L470,12L-3,40ZM5,5L6,6L4,9Z';
    expect(pointsOf(compactPath(d))).toEqual(
      'M512,-30 L498,-7 L470,12 L-3,40 Z M5,5 L6,6 L4,9 Z'.split(' '),
    );
  });

  it('rejects commands it does not expect', () => {
    expect(() => compactPath('M0,0A1,1,0,0,1,2,2Z')).toThrow('Unexpected path command');
  });
});
