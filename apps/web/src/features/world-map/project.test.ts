import { geoEqualEarth } from 'd3-geo';
import { describe, expect, it } from 'vitest';
import { project } from './project';
import { WORLD_MAP } from './world-map';

describe('project', () => {
  it("matches d3-geo's Equal Earth used to draw the map", () => {
    const { scale, translate } = WORLD_MAP.projection;
    const d3 = geoEqualEarth()
      .scale(scale)
      .translate([translate[0] ?? 0, translate[1] ?? 0]);
    for (const [lon, lat] of [
      [-71.1, 42.4], // Boston
      [-9.1, 38.7], // Lisboa
      [136.9, 35.2], // Nagoia
      [174.8, -41.3], // Wellington
      [-47.9, -15.8], // Brasília
    ] as const) {
      const [x, y] = project(WORLD_MAP.projection, lon, lat);
      const [ex, ey] = d3([lon, lat]) ?? [NaN, NaN];
      expect(x).toBeCloseTo(ex, 6);
      expect(y).toBeCloseTo(ey, 6);
    }
  });
});
