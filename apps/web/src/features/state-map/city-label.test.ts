import { describe, expect, it } from 'vitest';
import { cityLabel, pathBounds } from './city-label';

describe('pathBounds', () => {
  it('spans every point of every ring', () => {
    expect(pathBounds('M10,20L30,5L25,40ZM-2,8L4,9Z')).toEqual({
      minX: -2,
      minY: 5,
      maxX: 30,
      maxY: 40,
    });
  });

  it('has no bounds without points', () => {
    expect(pathBounds('')).toBeUndefined();
  });
});

describe('cityLabel', () => {
  it('goes above the city, centered on it', () => {
    expect(cityLabel('M400,500L600,500L600,600Z', '0 0 1000 1000', 40)).toEqual({
      x: 500,
      y: 484,
      side: 'above',
    });
  });

  it('goes below a city at the top edge', () => {
    expect(cityLabel('M400,20L600,20L600,100Z', '0 0 1000 1000', 40)).toEqual({
      x: 500,
      y: 116,
      side: 'below',
    });
  });

  it('stays off the side edges', () => {
    expect(cityLabel('M0,500L20,500L20,600Z', '0 0 1000 1000', 40)?.x).toBe(200);
    expect(cityLabel('M980,500L1000,500L1000,600Z', '0 0 1000 1000', 40)?.x).toBe(800);
  });
});
