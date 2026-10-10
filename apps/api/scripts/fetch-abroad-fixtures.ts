/**
 * Downloads the TSE results file of every city abroad into a fixtures folder, keeping
 * only the fields `tseResultFileSchema` reads (the full files are ~9 KB each).
 *
 *   pnpm --filter @stb/api fixtures:abroad 6257 test/fixtures/ele2026-6257
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ABROAD_CITIES } from '../src/adapters/tse/abroad-cities';
import { abroadCityScope } from '../src/adapters/tse/tse-abroad-source';
import { tseResultsUrl } from '../src/adapters/tse/http-loader';
import { strip, type RawFile } from './strip-tse-file';

const BASE_URL = 'https://resultados.tse.jus.br/oficial/ele2026';
const [electionCode, dir] = process.argv.slice(2);
if (!electionCode || !dir) throw new Error('Usage: fetch-abroad-fixtures <election> <dir>');

await mkdir(dir, { recursive: true });
for (const code of Object.keys(ABROAD_CITIES)) {
  const scope = abroadCityScope(code);
  const response = await fetch(tseResultsUrl(BASE_URL, electionCode, scope));
  if (!response.ok) throw new Error(`${scope}: HTTP ${response.status}`);
  const file = strip((await response.json()) as RawFile);
  await writeFile(join(dir, `${scope}.json`), `${JSON.stringify(file)}\n`);
}
console.log(`${Object.keys(ABROAD_CITIES).length} files written to ${dir}`);
