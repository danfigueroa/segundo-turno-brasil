/**
 * Writes the loading screen into `dist/index.html` (inside `#root`), so phones paint the
 * header and "Carregando resultados…" before the JavaScript downloads. React replaces it
 * on start. Runs after `vite build` and `vite build --ssr src/shell.tsx`.
 *
 *   pnpm --filter @stb/web build
 */
import { readFile, rm, writeFile } from 'node:fs/promises';

const dist = new URL('../dist/', import.meta.url);
const server = new URL('.shell/', dist);
const ROOT = '<div id="root"></div>';

const { renderShell } = (await import(new URL('shell.js', server).href)) as {
  renderShell: () => string;
};
const index = new URL('index.html', dist);
const html = await readFile(index, 'utf8');
if (!html.includes(ROOT)) throw new Error(`${ROOT} not found in dist/index.html`);
await writeFile(index, html.replace(ROOT, `<div id="root">${renderShell()}</div>`));
await rm(server, { recursive: true });
console.log('Prerendered the loading screen into dist/index.html');
