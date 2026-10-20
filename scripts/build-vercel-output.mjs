/**
 * Assembles the deployment in Vercel's Build Output API v3 format (`.vercel/output`):
 * the static web build plus each API function bundled into a single ESM file.
 * Bundling ourselves keeps the deploy independent of how Vercel would compile
 * TypeScript workspace packages. Docs: https://vercel.com/docs/build-output-api/v3
 */
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';

const OUTPUT = '.vercel/output';
const FUNCTIONS = {
  'api/results': 'apps/api/src/vercel/results.ts',
  'api/abroad': 'apps/api/src/vercel/abroad.ts',
  'api/history': 'apps/api/src/vercel/history.ts',
  'api/cities': 'apps/api/src/vercel/cities.ts',
};

/**
 * Seconds a function may run, explicit for the ones that read many TSE files: with a
 * cold instance, `/api/cities` downloads every municipality of a state (853 files in
 * Minas Gerais) and `/api/abroad` 186 cities; `/api/results` reads 29 files, each with a
 * timeout and one retry.
 */
const MAX_DURATION = { 'api/results': 30, 'api/abroad': 60, 'api/cities': 60 };

/**
 * Region the functions run in: São Paulo, next to the TSE servers. The CDN serves
 * users from its nearest edge regardless; this only shortens the hops to the TSE
 * (hundreds of files on a cold `/api/cities`). Hobby allows a single region.
 */
const REGIONS = ['gru1'];

/**
 * Dependencies published as CommonJS (e.g. `undici`, pulled in by `@vercel/blob`) call
 * `require()` for Node built-ins, which ES modules lack: give the bundle a real one.
 */
const REQUIRE_SHIM =
  "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);";

const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
};

/**
 * Public files without a hash in the name (candidate photos, favicon, link preview): a
 * day in the browser, so a returning visitor does not revalidate them (ADR 0031).
 */
const PUBLIC_FILE_CACHE = 'public, max-age=86400';

/** Body of an unknown `/api/*` path. */
const API_NOT_FOUND = 'api-404.json';

await rm(OUTPUT, { recursive: true, force: true });
await cp('apps/web/dist', `${OUTPUT}/static`, { recursive: true });
await writeJson(`${OUTPUT}/static/${API_NOT_FOUND}`, { error: 'Not found' });

for (const [route, entry] of Object.entries(FUNCTIONS)) {
  const dir = `${OUTPUT}/functions/${route}.func`;
  await build({
    entryPoints: [entry],
    outfile: `${dir}/index.mjs`,
    bundle: true,
    platform: 'node',
    target: 'node22',
    format: 'esm',
    banner: { js: REQUIRE_SHIM },
    minify: true,
    sourcemap: 'linked',
    logLevel: 'warning',
  });
  await writeJson(`${dir}/.vc-config.json`, {
    runtime: 'nodejs22.x',
    handler: 'index.mjs',
    launcherType: 'Nodejs',
    shouldAddHelpers: false,
    regions: REGIONS,
    ...(MAX_DURATION[route] && { maxDuration: MAX_DURATION[route] }),
  });
}

await writeJson(`${OUTPUT}/config.json`, {
  version: 3,
  routes: [
    { src: '/(.*)', headers: SECURITY_HEADERS, continue: true },
    {
      src: '/assets/(.*)',
      headers: { 'cache-control': 'public, max-age=31536000, immutable' },
      continue: true,
    },
    {
      src: '/(candidates/.*|favicon\\.svg|og\\.png)',
      headers: { 'cache-control': PUBLIC_FILE_CACHE },
      continue: true,
    },
    { handle: 'filesystem' },
    {
      src: '/api/(.*)',
      status: 404,
      dest: `/${API_NOT_FOUND}`,
      headers: { 'cache-control': 'no-store' },
    },
    { src: '/(.*)', dest: '/index.html' },
  ],
});

console.log(`Vercel output written to ${OUTPUT}`);

async function writeJson(path, data) {
  await mkdir(path.slice(0, path.lastIndexOf('/')), { recursive: true });
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`);
}
