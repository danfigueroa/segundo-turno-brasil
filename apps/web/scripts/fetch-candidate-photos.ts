/**
 * Downloads the official ballot photos of the runoff candidates from the TSE results CDN
 * into `public/candidates/{ballot number}.jpeg`, so the browser never calls the TSE.
 * Source: `{base}/{election}/fotos/br/{sqcand}.jpeg`, with `sqcand` from the Brazil file.
 *
 *   pnpm --filter @stb/web photos:fetch [election code, default 6258]
 */
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = 'https://resultados.tse.jus.br/oficial/ele2026';
const election = process.argv[2] ?? '6258';
const output = new URL('../public/candidates/', import.meta.url);

interface BrazilFile {
  carg: { agr: { par: { cand: { n: string; sqcand: string; nmu: string }[] }[] }[] }[];
}

const fileUrl = `${BASE_URL}/${election}/dados/br/br-c0001-e${election.padStart(6, '0')}-u.json`;
const response = await fetch(fileUrl);
if (!response.ok) throw new Error(`${fileUrl}: HTTP ${response.status}`);
const file = (await response.json()) as BrazilFile;
const candidates = file.carg.flatMap((office) =>
  office.agr.flatMap((coalition) => coalition.par.flatMap((party) => party.cand)),
);

await mkdir(output, { recursive: true });
for (const candidate of candidates) {
  const photoUrl = `${BASE_URL}/${election}/fotos/br/${candidate.sqcand}.jpeg`;
  const photo = await fetch(photoUrl);
  if (!photo.ok) throw new Error(`${photoUrl}: HTTP ${photo.status}`);
  await writeFile(new URL(`${candidate.n}.jpeg`, output), Buffer.from(await photo.arrayBuffer()));
  console.log(`${candidate.n} ${candidate.nmu}`);
}
