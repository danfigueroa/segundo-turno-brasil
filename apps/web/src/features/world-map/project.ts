/** Equal Earth polynomial coefficients (Šavrič, Patterson & Jenny, 2018), as in d3-geo. */
const A1 = 1.340264;
const A2 = -0.081106;
const A3 = 0.000893;
const A4 = 0.003796;
const M = Math.sqrt(3) / 2;

export interface Projection {
  readonly scale: number;
  readonly translate: readonly number[];
}

/**
 * Longitude/latitude in degrees → map coordinates, with the same Equal Earth projection
 * `scripts/build-world-map.ts` used to draw the land (d3-geo's `geoEqualEarth`), so the
 * browser can place the cities without shipping d3.
 */
export function project(
  { scale, translate: [tx = 0, ty = 0] }: Projection,
  lon: number,
  lat: number,
): [number, number] {
  const lambda = (lon * Math.PI) / 180;
  const l = Math.asin(M * Math.sin((lat * Math.PI) / 180));
  const l2 = l * l;
  const l6 = l2 * l2 * l2;
  const x = (lambda * Math.cos(l)) / (M * (A1 + 3 * A2 * l2 + l6 * (7 * A3 + 9 * A4 * l2)));
  const y = l * (A1 + A2 * l2 + l6 * (A3 + A4 * l2));
  return [tx + scale * x, ty - scale * y];
}
