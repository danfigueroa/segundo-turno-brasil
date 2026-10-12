/**
 * Builds the 2022 presidential runoff (Lula × Jair Bolsonaro) that the analysis compares
 * with: final votes of ballot numbers 13 and 22 per state, abroad and Brazil, and the
 * national count curve (share at each percent of sections counted).
 *
 * Sources (TSE open data, CDN): `votacao_candidato_munzona_2022.zip`, of which only the
 * presidential member (~2 MB of a 580 MB zip) is downloaded with HTTP range requests, and
 * `Historico_Totalizacao_Presidente_BR_2T_2022.zip`.
 *
 *   pnpm --filter @stb/web data:2022
 */
import { writeFile } from 'node:fs/promises';
import { inflateRawSync } from 'node:zlib';

const MUNZONA =
  'https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_candidato_munzona/votacao_candidato_munzona_2022.zip';
const MUNZONA_MEMBER = 'votacao_candidato_munzona_2022_BR.csv';
const HISTORY =
  'https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes2022/Historico_Totalizacao_Presidente_BR_2T_2022.zip';
const HISTORY_MEMBER = 'Historico_Totalizacao_Presidente_BR_2T_2022.csv';
const OUTPUT = new URL('../src/features/insights/data/runoff-2022.generated.json', import.meta.url);

const NUMBERS = ['13', '22'] as const;

async function range(url: string, start: number, end: number): Promise<Buffer> {
  const response = await fetch(url, { headers: { range: `bytes=${start}-${end}` } });
  if (response.status !== 206) throw new Error(`${url}: HTTP ${response.status} for a range`);
  return Buffer.from(await response.arrayBuffer());
}

async function sizeOf(url: string): Promise<number> {
  const response = await fetch(url, { method: 'HEAD' });
  const length = Number(response.headers.get('content-length'));
  if (!response.ok || !length) throw new Error(`${url}: no content length`);
  return length;
}

const MAX = 0xffffffff;

/** Reads one member of a remote zip (ZIP64 aware) without downloading the rest. */
async function readZipMember(url: string, name: string): Promise<Buffer> {
  const size = await sizeOf(url);
  const tailStart = Math.max(0, size - 65_536);
  const tail = await range(url, tailStart, size - 1);
  const eocd = tail.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) throw new Error('End of central directory not found');
  let cdSize = tail.readUInt32LE(eocd + 12);
  let cdOffset = tail.readUInt32LE(eocd + 16);
  if (cdOffset === MAX || cdSize === MAX) {
    const zip64 = tail.lastIndexOf(Buffer.from([0x50, 0x4b, 0x06, 0x06]));
    if (zip64 < 0) throw new Error('ZIP64 end of central directory not found');
    cdSize = Number(tail.readBigUInt64LE(zip64 + 40));
    cdOffset = Number(tail.readBigUInt64LE(zip64 + 48));
  }

  const cd = await range(url, cdOffset, cdOffset + cdSize - 1);
  for (let at = 0; at < cd.length && cd.readUInt32LE(at) === 0x02014b50;) {
    const method = cd.readUInt16LE(at + 10);
    let compressed = cd.readUInt32LE(at + 20);
    let uncompressed = cd.readUInt32LE(at + 24);
    const nameLength = cd.readUInt16LE(at + 28);
    const extraLength = cd.readUInt16LE(at + 30);
    const commentLength = cd.readUInt16LE(at + 32);
    let local = cd.readUInt32LE(at + 42);
    const entry = cd.toString('latin1', at + 46, at + 46 + nameLength);
    // ZIP64 extra field: the sizes and offset that did not fit, in this order.
    const extra = cd.subarray(at + 46 + nameLength, at + 46 + nameLength + extraLength);
    for (let e = 0; e + 4 <= extra.length; e += 4 + extra.readUInt16LE(e + 2)) {
      if (extra.readUInt16LE(e) !== 0x0001) continue;
      let field = e + 4;
      const next = () => Number(extra.readBigUInt64LE((field += 8) - 8));
      if (uncompressed === MAX) uncompressed = next();
      if (compressed === MAX) compressed = next();
      if (local === MAX) local = next();
    }
    if (entry === name) {
      const header = await range(url, local, local + 29);
      const dataStart = local + 30 + header.readUInt16LE(26) + header.readUInt16LE(28);
      const data = await range(url, dataStart, dataStart + compressed - 1);
      if (method === 0) return data;
      if (method !== 8) throw new Error(`Unsupported zip method ${method}`);
      const inflated = inflateRawSync(data);
      if (inflated.length !== uncompressed) throw new Error(`${name}: wrong size`);
      return inflated;
    }
    at += 46 + nameLength + extraLength + commentLength;
  }
  throw new Error(`${name} not found in ${url}`);
}

/** Rows of a TSE CSV (Latin-1, `;`-separated, values in double quotes or bare). */
function parseCsv(buffer: Buffer): Record<string, string>[] {
  const lines = buffer.toString('latin1').split(/\r?\n/).filter(Boolean);
  const split = (line: string) =>
    [...line.matchAll(/(?:^|;)\s*(?:"([^"]*)"|([^;]*))/g)].map((m) => (m[1] ?? m[2] ?? '').trim());
  const [head = '', ...rows] = lines;
  const columns = split(head);
  return rows.map((line) => {
    const values = split(line);
    return Object.fromEntries(columns.map((column, i) => [column, values[i] ?? '']));
  });
}

type Votes = Record<(typeof NUMBERS)[number], number>;
const emptyVotes = (): Votes => ({ '13': 0, '22': 0 });

const munzona = parseCsv(await readZipMember(MUNZONA, MUNZONA_MEMBER));
const scopes = new Map<string, Votes>();
for (const row of munzona) {
  const number = row.NR_CANDIDATO;
  if (row.NR_TURNO !== '2' || row.CD_CARGO !== '1') continue;
  if (number !== '13' && number !== '22') continue;
  const uf = row.SG_UF ?? '';
  const votes = scopes.get(uf) ?? emptyVotes();
  votes[number] += Number(row.QT_VOTOS_NOMINAIS_VALIDOS);
  scopes.set(uf, votes);
}
const country = emptyVotes();
for (const votes of scopes.values()) for (const n of NUMBERS) country[n] += votes[n];
const { ZZ: abroad, ...states } = Object.fromEntries(
  [...scopes].sort(([a], [b]) => a.localeCompare(b)),
);
if (!abroad || Object.keys(states).length !== 27) throw new Error('Expected 27 states and abroad');

// The national count curve: Lula's and Bolsonaro's votes at each percent counted.
const history = parseCsv(await readZipMember(HISTORY, HISTORY_MEMBER));
const points = history.map((row) => ({
  counted: Number((row.PE_SECOES_TOT_ACUMULADO ?? '').replace(',', '.')) * 100,
  '13': Number(row.LULA_QT_VOTOS_TOT_ACUMULADO),
  '22': Number(row.JAIR_BOLSONARO_QT_VOTOS_TOT_ACUMULADO),
}));
const curve = Array.from({ length: 100 }, (_, i) => i + 1).flatMap((percent) => {
  const point = points.findLast((p) => p.counted <= percent);
  return point ? [[percent, point['13'], point['22']]] : [];
});

await writeFile(
  OUTPUT,
  `${JSON.stringify({ names: { '13': 'Lula', '22': 'Jair Bolsonaro' }, country, abroad, states, curve })}\n`,
);
const share = (country['13'] / (country['13'] + country['22'])) * 100;
console.log(`Lula ${share.toFixed(2)}% in Brazil; ${curve.length} curve points`);
