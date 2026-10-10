import { describe, expect, it } from 'vitest';
import { fitViewBox, formatViewBox, interpolateViewBox, parseViewBox } from './viewport';

const world = parseViewBox('0 0 1000 440');

describe('fitViewBox', () => {
  it('shows the whole world without cities', () => {
    expect(fitViewBox([], world)).toBe(world);
  });

  it('frames the cities with padding, no narrower than a square', () => {
    const view = fitViewBox(
      [
        { x: 200, y: 100 },
        { x: 300, y: 350 },
      ],
      world,
    );
    // 100 × 250 plus 40 on each side → 180 × 330, widened to 330 × 330 around x = 250.
    expect(view).toEqual({ x: 85, y: 60, width: 330, height: 330 });
  });

  it('widens a single city to a minimum and keeps the view inside the world', () => {
    const view = fitViewBox([{ x: 990, y: 10 }], world);
    expect(view.width).toBe(260);
    expect(view.width / view.height).toBeCloseTo(1000 / 440);
    expect(view.x + view.width).toBe(1000);
    expect(view.y).toBe(0);
  });

  it('falls back to the world when the cities span it', () => {
    expect(
      fitViewBox(
        [
          { x: 10, y: 200 },
          { x: 990, y: 210 },
        ],
        world,
      ),
    ).toBe(world);
  });
});

describe('interpolateViewBox', () => {
  it('moves each edge the same share of the way', () => {
    const to = { x: 100, y: 40, width: 500, height: 220 };
    expect(interpolateViewBox(world, to, 0.5)).toEqual({ x: 50, y: 20, width: 750, height: 330 });
  });
});

describe('formatViewBox', () => {
  it('round-trips with parseViewBox, one decimal at most', () => {
    expect(formatViewBox({ x: 1.23, y: 0, width: 333.333, height: 440 })).toBe('1.2 0 333.3 440');
    expect(parseViewBox('1.2 0 333.3 440')).toEqual({ x: 1.2, y: 0, width: 333.3, height: 440 });
  });
});
