/**
 * Pre-renders the world map for the votes abroad into SVG paths, so the browser ships no
 * projection library: land (without Antarctica) and Brazil, in the Equal Earth projection.
 * Input: Natural Earth 1:110m countries from `world-atlas`.
 * Output: `src/features/world-map/world-map.generated.json`, including the projection's
 * scale and translation so the browser can place the cities (`project.ts`).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { geoEqualEarth, geoPath } from 'd3-geo';
import type { FeatureCollection, Geometry } from 'geojson';
import { feature, merge } from 'topojson-client';
import type {
  GeometryCollection,
  GeometryObject,
  MultiPolygon,
  Polygon,
  Topology,
} from 'topojson-specification';

const WIDTH = 1000;
/** ISO 3166-1 numeric codes in Natural Earth. */
const ANTARCTICA = '010';
const BRAZIL = '076';

const require = createRequire(import.meta.url);
const topology = JSON.parse(
  readFileSync(require.resolve('world-atlas/countries-110m.json'), 'utf8'),
) as Topology<{ countries: GeometryCollection }>;

const countries = topology.objects.countries.geometries;
const isArea = (g: GeometryObject): g is Polygon | MultiPolygon =>
  g.type === 'Polygon' || g.type === 'MultiPolygon';
const inhabited = countries.filter(isArea).filter((c) => c.id !== ANTARCTICA);
const land = merge(topology, inhabited);
const brazilGeometry = countries.find((c) => c.id === BRAZIL);
if (!brazilGeometry) throw new Error('Brazil not found in world-atlas');
const brazil = feature(topology, brazilGeometry);

const inhabitedLand: FeatureCollection<Geometry> = {
  type: 'FeatureCollection',
  features: [{ type: 'Feature', properties: {}, geometry: land }],
};
const projection = geoEqualEarth().fitWidth(WIDTH, inhabitedLand);
const path = geoPath(projection).digits(0);

const [[, minY], [, maxY]] = path.bounds(inhabitedLand);
const [brazilX, brazilY] = path.centroid(brazil);
const [translateX, translateY] = projection.translate();
writeFileSync(
  new URL('../src/features/world-map/world-map.generated.json', import.meta.url),
  `${JSON.stringify({
    viewBox: `0 ${Math.floor(minY)} ${WIDTH} ${Math.ceil(maxY - minY)}`,
    projection: { scale: projection.scale(), translate: [translateX, translateY] },
    land: path(land),
    brazil: { d: path(brazil), label: [Math.round(brazilX), Math.round(brazilY)] },
  })}\n`,
);
console.log('World map written.');
