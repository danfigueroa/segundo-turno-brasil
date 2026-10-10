import { describe, expect, it } from 'vitest';
import { countryLabels } from './country-labels';

const options = { count: 8, fontSize: 20, width: 1000 };

describe('countryLabels', () => {
  it('names the countries with most polling stations first, up to the count', () => {
    const labels = countryLabels(
      [
        { name: 'Itália', x: 500, y: 600, weight: 10 },
        { name: 'Portugal', x: 100, y: 500, weight: 90 },
        { name: 'Suécia', x: 600, y: 100, weight: 5 },
      ],
      { ...options, count: 2 },
    );
    expect(labels.map((l) => l.name)).toEqual(['Portugal', 'Itália']);
  });

  it('skips a name that would overlap one already written', () => {
    const labels = countryLabels(
      [
        { name: 'Alemanha', x: 500, y: 400, weight: 50 },
        { name: 'Suíça', x: 540, y: 410, weight: 20 },
        { name: 'Holanda', x: 500, y: 370, weight: 10 },
      ],
      options,
    );
    expect(labels.map((l) => l.name)).toEqual(['Alemanha', 'Holanda']);
  });

  it('moves a name that would run off an edge inside the map', () => {
    const [left, right] = countryLabels(
      [
        { name: 'Cabo Verde', x: 10, y: 300, weight: 2 },
        { name: 'Emirados Árabes Unidos', x: 990, y: 300, weight: 1 },
      ],
      options,
    );
    // 10 characters × 20 × 0.6 = 120 wide; 22 characters = 264 wide.
    expect(left?.x).toBe(60);
    expect(right?.x).toBe(868);
  });
});
