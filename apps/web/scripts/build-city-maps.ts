/**
 * Pre-renders the municipal map of every state into SVG paths, one module per state that
 * the browser loads only when that state is opened (a hashed, immutable asset). Input: IBGE TopoJSON of each state's
 * municipalities ("mínima" quality) in `data/municipios/<uf>.topo.json`, downloaded with
 * `--download` from
 * https://servicodados.ibge.gov.br/api/v3/malhas/estados/<UF>?formato=application/json&intrarregiao=municipio&qualidade=minima
 * Output: `src/features/state-map/maps/<uf>.generated.json` with
 * `{ viewBox, cities: { <IBGE code>: <path> } }`.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { STATE_CODES } from '@stb/domain';
import { geoMercator, geoPath } from 'd3-geo';
import type { FeatureCollection, Geometry } from 'geojson';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';

const SIZE = 1000;
const IBGE = 'https://servicodados.ibge.gov.br/api/v3/malhas/estados';
const dataDir = new URL('../data/municipios/', import.meta.url);
const outDir = new URL('../src/features/state-map/maps/', import.meta.url);

type Municipalities = Topology<Record<string, GeometryCollection<{ codarea: string }>>>;

if (process.argv.includes('--download')) {
  mkdirSync(dataDir, { recursive: true });
  for (const uf of STATE_CODES) {
    const url = `${IBGE}/${uf}?formato=application/json&intrarregiao=municipio&qualidade=minima`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    writeFileSync(new URL(`${uf.toLowerCase()}.topo.json`, dataDir), await response.text());
  }
}

mkdirSync(outDir, { recursive: true });
for (const uf of STATE_CODES) {
  const name = uf.toLowerCase();
  const topology = JSON.parse(
    readFileSync(new URL(`${name}.topo.json`, dataDir), 'utf8'),
  ) as Municipalities;
  const [object] = Object.values(topology.objects);
  if (!object) throw new Error(`No municipalities in ${name}.topo.json`);
  const municipalities: FeatureCollection<Geometry, { codarea: string }> = feature(
    topology,
    object,
  );

  const projection = geoMercator().fitSize([SIZE, SIZE], municipalities);
  const path = geoPath(projection).digits(0);
  const [[minX, minY], [maxX, maxY]] = path.bounds(municipalities);
  const cities = Object.fromEntries(
    municipalities.features.map((f) => [f.properties.codarea, path(f)]),
  );
  const json = JSON.stringify({
    viewBox: `${Math.floor(minX)} ${Math.floor(minY)} ${Math.ceil(maxX - minX)} ${Math.ceil(maxY - minY)}`,
    cities,
  });
  writeFileSync(new URL(`${name}.generated.json`, outDir), `${json}\n`);
  console.log(
    `${uf}: ${municipalities.features.length} municipalities, ${Math.round(gzipSync(json).length / 1024)} KB gzip`,
  );
}
