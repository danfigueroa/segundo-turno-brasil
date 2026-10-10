/**
 * Pre-renders the map of Brazil into SVG paths, so the browser ships no projection code.
 * Input: IBGE TopoJSON of the states (`data/br-uf.topo.json`, "mínima" quality), from
 * https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/json&intrarregiao=UF&qualidade=minima
 * Output: `src/features/map/brazil-map.generated.json`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { STATES, type StateCode } from '@stb/domain';
import { geoMercator, geoPath } from 'd3-geo';
import type { FeatureCollection, Geometry } from 'geojson';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';

const WIDTH = 1000;
const HEIGHT = 1000;

const topology = JSON.parse(
  readFileSync(new URL('../data/br-uf.topo.json', import.meta.url), 'utf8'),
) as Topology<{ BRUF: GeometryCollection<{ codarea: string }> }>;

const states: FeatureCollection<Geometry, { codarea: string }> = feature(
  topology,
  topology.objects.BRUF,
);

const projection = geoMercator().fitSize([WIDTH, HEIGHT], states);
const path = geoPath(projection).digits(0);

const byIbgeCode = new Map<string, StateCode>(
  (Object.keys(STATES) as StateCode[]).map((code) => [STATES[code].ibgeCode, code]),
);

const paths = Object.fromEntries(
  states.features.map((f) => {
    const code = byIbgeCode.get(f.properties.codarea);
    if (!code) throw new Error(`Unknown IBGE code ${f.properties.codarea}`);
    const [x, y] = path.centroid(f);
    return [code, { d: path(f), label: [Math.round(x), Math.round(y)] }];
  }),
);

const [[, minY], [, maxY]] = path.bounds(states);
writeFileSync(
  new URL('../src/features/map/brazil-map.generated.json', import.meta.url),
  `${JSON.stringify({ viewBox: `0 ${Math.floor(minY)} ${WIDTH} ${Math.ceil(maxY - minY)}`, states: paths })}\n`,
);
console.log(`Map written with ${states.features.length} states.`);
