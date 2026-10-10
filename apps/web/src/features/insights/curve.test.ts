import type { CountPoint } from '@stb/domain';
import { describe, expect, it } from 'vitest';
import { tally } from '../../../test/fixtures';
import { finalistsOf } from '../../lib/finalists';
import { curveOf, mergePoints } from './curve';

const finalists = finalistsOf(tally({ kind: 'country' }, 10, 9));
const point = (counted: number, lula: number, flavio: number): CountPoint => ({
  at: '2026-10-25T18:00:00-03:00',
  counted,
  total: 100,
  votes: { '13': lula, '22': flavio },
});

describe('mergePoints', () => {
  it('orders by count and drops repeats and empty counts', () => {
    const merged = mergePoints(
      [point(10, 1, 1), point(30, 3, 3)],
      [point(30, 9, 9), point(20, 2, 2)],
      [point(0, 0, 0)],
    );
    expect(merged.map((p) => p.counted)).toEqual([10, 20, 30]);
  });
});

describe('curveOf', () => {
  it('scales shares between the finalists to a box zoomed around 50%', () => {
    const curve = curveOf([point(10, 46, 54), point(50, 52, 48)], finalists);
    expect(curve).toMatchObject({ yMin: 45, yMax: 55, middle: 50 });
    expect(curve?.lines[0]?.path).toBe('M 10.00 90.00 L 50.00 30.00');
    expect(curve?.lines[1]?.end).toEqual({ x: 50, y: 70 });
    expect(curve?.lines[0]?.last).toBe(52);
  });

  it('marks where the lead changed', () => {
    const curve = curveOf([point(10, 40, 60), point(40, 49, 51), point(70, 51, 49)], finalists);
    expect(curve?.changes).toEqual([{ counted: 70, x: 70, y: 50, leader: finalists[0] }]);
  });

  it('needs points', () => {
    expect(curveOf([], finalists)).toBeUndefined();
  });
});
