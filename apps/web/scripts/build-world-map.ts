/**
 * Pre-renders one map per continent for the votes abroad into SVG paths, so the browser
 * ships no projection library and only downloads the continent on screen. Every country
 * is a path; those with Brazilian polling stations carry their name as the TSE writes it
 * (`CountryResult.name`), so the browser paints them in the color of who leads.
 * Input: Natural Earth 1:50m countries from `world-atlas`.
 * Output: `src/features/world-map/maps/<continent>.generated.json`.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { gzipSync } from 'node:zlib';
import { CONTINENT_CODES, type ContinentCode } from '@stb/domain';
import { geoAzimuthalEqualArea, geoPath } from 'd3-geo';
import type { Feature, MultiPoint, MultiPolygon, Polygon } from 'geojson';
import { feature } from 'topojson-client';
import { presimplify, simplify } from 'topojson-simplify';
import type { GeometryCollection, Topology } from 'topojson-specification';
import { ABROAD_CITIES } from '../../api/src/adapters/tse/abroad-cities';

const WIDTH = 1000;
/** Countries smaller than this (in square viewBox units) also get a marker to be seen. */
const TINY_AREA = 40;
/** Detail dropped by simplification, in square viewBox units: invisible on a phone. */
const SIMPLIFY_AREA = 0.5;

/**
 * What each continent shows, as [[west, south], [east, north]] in degrees: every city
 * with polling stations, without the empty north of Canada and Russia.
 */
const BOXES: Record<ContinentCode, [[number, number], [number, number]]> = {
  AM: [
    [-126, -56],
    [-34, 52],
  ],
  EU: [
    [-11, 35],
    [42, 63],
  ],
  AS: [
    [26, -47],
    [178, 54],
  ],
  AF: [
    [-26, -35],
    [52, 38],
  ],
};

/** ISO 3166-1 numeric code (as in Natural Earth) of each country the TSE names. */
const ISO: Record<string, string> = {
  'África do Sul': '710',
  Albânia: '008',
  Alemanha: '276',
  Angola: '024',
  'Antígua e Barbuda': '028',
  'Arábia Saudita': '682',
  Argélia: '012',
  Argentina: '032',
  Armênia: '051',
  Austrália: '036',
  Áustria: '040',
  Azerbaijão: '031',
  Bahamas: '044',
  Bahrein: '048',
  Bangladesh: '050',
  Barbados: '052',
  Bélgica: '056',
  Belize: '084',
  Benin: '204',
  Bolívia: '068',
  'Bósnia e Herzegovina': '070',
  Botsuana: '072',
  Bulgária: '100',
  'Burkina Faso': '854',
  'Cabo Verde': '132',
  Camarões: '120',
  Canadá: '124',
  Catar: '634',
  Cazaquistão: '398',
  Chile: '152',
  China: '156',
  Chipre: '196',
  Colômbia: '170',
  'Coreia do Norte': '408',
  'Coreia do Sul': '410',
  'Costa do Marfim': '384',
  'Costa Rica': '188',
  Croácia: '191',
  Cuba: '192',
  Dinamarca: '208',
  Egito: '818',
  'El Salvador': '222',
  'Emirados Árabes Unidos': '784',
  Equador: '218',
  Eslováquia: '703',
  Eslovênia: '705',
  Espanha: '724',
  'Estados Unidos': '840',
  Estônia: '233',
  Etiópia: '231',
  Filipinas: '608',
  Finlândia: '246',
  França: '250',
  Gabão: '266',
  Gana: '288',
  Geórgia: '268',
  Grécia: '300',
  Guatemala: '320',
  Guiana: '328',
  Guiné: '324',
  'Guiné Equatorial': '226',
  'Guiné-Bissau': '624',
  Haiti: '332',
  Holanda: '528',
  Honduras: '340',
  Hungria: '348',
  Índia: '356',
  Indonésia: '360',
  Irã: '364',
  Iraque: '368',
  Irlanda: '372',
  Israel: '376',
  Itália: '380',
  Jamaica: '388',
  Japão: '392',
  Jordânia: '400',
  Kuwait: '414',
  Líbano: '422',
  Líbia: '434',
  Malásia: '458',
  Malaui: '454',
  Mali: '466',
  Marrocos: '504',
  México: '484',
  Mianmar: '104',
  Moçambique: '508',
  Namíbia: '516',
  Nepal: '524',
  Nicarágua: '558',
  Nigéria: '566',
  Noruega: '578',
  'Nova Zelândia': '554',
  Omã: '512',
  Palestina: '275',
  Panamá: '591',
  Paquistão: '586',
  Paraguai: '600',
  Peru: '604',
  Polônia: '616',
  Portugal: '620',
  Quênia: '404',
  'Reino Unido': '826',
  'República Democrática do Congo': '180',
  'República do Congo': '178',
  'República Dominicana': '214',
  'República Tcheca': '203',
  Romênia: '642',
  Rússia: '643',
  'Santa Lúcia': '662',
  'São Tomé e Príncipe': '678',
  Senegal: '686',
  Sérvia: '688',
  Singapura: '702',
  Síria: '760',
  'Sri Lanka': '144',
  Suécia: '752',
  Suíça: '756',
  Suriname: '740',
  Tailândia: '764',
  Taiwan: '158',
  Tanzânia: '834',
  'Timor-Leste': '626',
  Togo: '768',
  'Trinidad e Tobago': '780',
  Tunísia: '788',
  Turquia: '792',
  Ucrânia: '804',
  Uruguai: '858',
  Venezuela: '862',
  Vietnã: '704',
  Zâmbia: '894',
  Zimbábue: '716',
};
const BRAZIL = '076';
const ANTARCTICA = '010';
const FRANCE = '250';
/** French Guiana is part of France in Natural Earth, but the TSE counts it apart. */
const FRENCH_GUIANA = 'Guiana Francesa';

type Area = Feature<Polygon | MultiPolygon, { name: string }>;

type Countries = Topology<{ countries: GeometryCollection<{ name: string }> }>;

const require = createRequire(import.meta.url);
const world = presimplify(
  JSON.parse(readFileSync(require.resolve('world-atlas/countries-50m.json'), 'utf8')) as Countries,
);

const tseName = new Map(Object.entries(ISO).map(([name, id]) => [id, name]));
const nameOf = (area: Area): string | undefined =>
  area.properties.name === FRENCH_GUIANA ? FRENCH_GUIANA : tseName.get(String(area.id));

const outDir = new URL('../src/features/world-map/maps/', import.meta.url);
mkdirSync(outDir, { recursive: true });

for (const continent of CONTINENT_CODES) {
  const [[west, south], [east, north]] = BOXES[continent];
  // Sampled edges of the box: fitting its corners alone would cut the curved sides.
  const edge: MultiPoint = { type: 'MultiPoint', coordinates: [] };
  for (let i = 0; i <= 20; i++) {
    const lon = west + ((east - west) * i) / 20;
    const lat = south + ((north - south) * i) / 20;
    edge.coordinates.push([lon, south], [lon, north], [west, lat], [east, lat]);
  }
  const projection = geoAzimuthalEqualArea()
    .rotate([-(west + east) / 2, -(south + north) / 2])
    .fitWidth(WIDTH, edge);
  const [, [, maxY]] = geoPath(projection).bounds(edge);
  const height = Math.ceil(maxY);
  projection.clipExtent([
    [0, 0],
    [WIDTH, height],
  ]);
  const path = geoPath(projection).digits(0);
  // Each continent is drawn at its own scale: drop what would be under a pixel there.
  const degree = (projection.scale() * Math.PI) / 180;
  const areas = areasOf(simplify(world, SIMPLIFY_AREA / degree ** 2) as Countries);

  const countries = areas.flatMap((area) => {
    const d = path(area);
    if (!d) return [];
    const name = nameOf(area);
    const [x, y] = path.centroid(area).map(Math.round);
    const tiny = path.area(area) < TINY_AREA;
    if (area.id === BRAZIL) return [{ d, brazil: true, label: [x, y] }];
    if (!name) return [{ d }];
    return [{ d, name, label: [x, y], ...(tiny && { tiny: true }) }];
  });

  const missing = [
    ...new Set(
      Object.values(ABROAD_CITIES)
        .filter((city) => city.continent === continent)
        .map((city) => city.country),
    ),
  ].filter((country) => !countries.some((c) => 'name' in c && c.name === country));
  if (missing.length) throw new Error(`${continent}: no shape for ${missing.join(', ')}`);

  const json = JSON.stringify({ viewBox: `0 0 ${WIDTH} ${height}`, countries });
  writeFileSync(new URL(`${continent.toLowerCase()}.generated.json`, outDir), `${json}\n`);
  console.log(
    `${continent}: ${countries.length} countries, ${Math.round(gzipSync(json).length / 1024)} KB gzip`,
  );
}

/** Every country but Antarctica, with French Guiana apart from France. */
function areasOf(topology: Countries): Area[] {
  return topology.objects.countries.geometries
    .filter((g) => g.id !== ANTARCTICA && (g.type === 'Polygon' || g.type === 'MultiPolygon'))
    .flatMap((g) => {
      const area = feature(topology, g) as Area;
      return area.id === FRANCE ? splitFrenchGuiana(area) : [area];
    });
}

/** France without its South American part, and that part as French Guiana. */
function splitFrenchGuiana(france: Area): Area[] {
  if (france.geometry.type !== 'MultiPolygon') return [france];
  const inGuiana = (polygon: number[][][]) => {
    const [lon = 0, lat = 0] = polygon[0]?.[0] ?? [];
    return lon > -55 && lon < -51 && lat > 2 && lat < 6;
  };
  const polygons = france.geometry.coordinates;
  return [
    {
      ...france,
      geometry: { type: 'MultiPolygon', coordinates: polygons.filter((p) => !inGuiana(p)) },
    },
    {
      type: 'Feature',
      id: 'GUF',
      properties: { name: FRENCH_GUIANA },
      geometry: { type: 'MultiPolygon', coordinates: polygons.filter(inGuiana) },
    },
  ];
}
