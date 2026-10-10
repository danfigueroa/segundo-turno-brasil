/**
 * Downloads the files of the breakdown by municipality of some states into a fixtures
 * folder, keeping only the fields the adapter reads: the municipality list (`cm.json`,
 * only those states), each state's progress file (`<uf>-ab.json`) and one results file
 * per municipality (`<uf><code>.json`).
 *
 *   pnpm --filter @stb/api fixtures:cities 6257 test/fixtures/ele2026-6257 ac ap rr
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  tseMunicipalitiesUrl,
  tseProgressUrl,
  tseResultsUrl,
} from '../src/adapters/tse/http-loader';
import { strip, type RawFile } from './strip-tse-file';

const BASE_URL = 'https://resultados.tse.jus.br/oficial/ele2026';
const [electionCode, dir, ...states] = process.argv.slice(2);
if (!electionCode || !dir || states.length === 0) {
  throw new Error('Usage: fetch-city-fixtures <election> <dir> <uf>...');
}

interface MunicipalitiesFile {
  abr: { cd: string; mu: { cd: string; cdi: string; nm: string }[] }[];
}

interface ProgressFile {
  abr: { cdabr: string; dt: string; ht: string; s: { st: string } }[];
}

async function get<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return (await response.json()) as T;
}

const save = (name: string, data: unknown) =>
  writeFile(join(dir, `${name}.json`), `${JSON.stringify(data)}\n`);

await mkdir(dir, { recursive: true });
const config = await get<MunicipalitiesFile>(tseMunicipalitiesUrl(BASE_URL, electionCode));
const scopes = config.abr
  .filter((scope) => states.includes(scope.cd))
  .map((scope) => ({ cd: scope.cd, mu: scope.mu.map(({ cd, cdi, nm }) => ({ cd, cdi, nm })) }));
await save('cm', { abr: scopes });

let files = 0;
for (const scope of scopes) {
  // Some progress files are only published once the count starts.
  const progress = await get<ProgressFile>(tseProgressUrl(BASE_URL, electionCode, scope.cd)).catch(
    (error: unknown) => console.warn(String(error)),
  );
  if (progress) {
    await save(`${scope.cd}-ab`, {
      abr: progress.abr.map(({ cdabr, dt, ht, s }) => ({ cdabr, dt, ht, s: { st: s.st } })),
    });
  }
  for (const municipality of scope.mu) {
    const code = `${scope.cd}${municipality.cd}`;
    await save(code, strip(await get<RawFile>(tseResultsUrl(BASE_URL, electionCode, code))));
    files += 1;
  }
}
console.log(`${files} municipalities of ${scopes.length} states written to ${dir}`);
