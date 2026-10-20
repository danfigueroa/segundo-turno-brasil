/**
 * Fails when the initial JavaScript goes over budget (ADR 0005): the entry script of
 * `apps/web/dist/index.html` plus every chunk it preloads, gzipped. Run after
 * `pnpm build`. Chunks loaded on demand (maps by state and continent, share, insights)
 * are not counted.
 */
import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const DIST = 'apps/web/dist';
/** Budget in KiB of gzip: ≈ 120 KB of code plus the pt-BR texts (ADR 0030). */
const BUDGET_KIB = 124;

const html = await readFile(`${DIST}/index.html`, 'utf8');
const scripts = [
  ...html.matchAll(/<script[^>]+type="module"[^>]+src="\/([^"]+\.js)"/g),
  ...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="\/([^"]+\.js)"/g),
].map(([, path]) => path);
if (scripts.length === 0) throw new Error(`No scripts found in ${DIST}/index.html`);

let total = 0;
for (const path of new Set(scripts)) {
  const size = gzipSync(await readFile(`${DIST}/${path}`), { level: 9 }).length;
  total += size;
  console.log(`${(size / 1024).toFixed(1).padStart(7)} KiB  ${path}`);
}
const kib = total / 1024;
console.log(`${kib.toFixed(1).padStart(7)} KiB  initial JS (gzip), budget ${BUDGET_KIB} KiB`);
if (kib > BUDGET_KIB) {
  console.error(`Initial JS is ${(kib - BUDGET_KIB).toFixed(1)} KiB over budget.`);
  process.exit(1);
}
