/**
 * Runs every bundled function in `.vercel/output` against a real request, each in its own
 * Node process, and fails if one crashes or answers an unexpected status. The unit tests
 * run the TypeScript sources; this catches problems only the bundle has (e.g. CommonJS
 * dependencies calling `require()` inside the ES module).
 */
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { resolve } from 'node:path';

const OUTPUT = '.vercel/output/functions';
const fixtures = {
  DATA_SOURCE: 'fixture',
  FIXTURES_DIR: resolve('apps/api/test/fixtures/ele2026-6257'),
};
// Exercises the Blob SDK: fake credentials, so a handled 503 is fine, a crash is not.
const blob = { DATA_SOURCE: 'tse', BLOB_STORE_ID: 'store_smoke' };

const CASES = [
  { fn: 'results', path: '/api/results?round=1', env: fixtures, expect: [200] },
  { fn: 'results', path: '/api/results', env: fixtures, expect: [200] },
  { fn: 'abroad', path: '/api/abroad?round=1', env: fixtures, expect: [200] },
  { fn: 'cities', path: '/api/cities?uf=ac&round=1', env: fixtures, expect: [200] },
  { fn: 'history', path: '/api/history', env: fixtures, expect: [200] },
  { fn: 'history', path: '/api/history', env: blob, expect: [200, 503] },
];

if (process.argv[2] === '--run') {
  await runOne(process.argv[3], process.argv[4]);
} else {
  let failed = false;
  for (const { fn, path, env, expect } of CASES) {
    const child = spawnSync(
      process.execPath,
      [import.meta.filename, '--run', resolve(`${OUTPUT}/api/${fn}.func/index.mjs`), path],
      { env: { ...process.env, ...env }, encoding: 'utf8', timeout: 30_000 },
    );
    const status = Number(child.stdout.trim().split('\n').at(-1));
    const ok = child.status === 0 && expect.includes(status);
    failed ||= !ok;
    console.log(
      `${ok ? 'ok  ' : 'FAIL'} ${fn} ${path} (${env.DATA_SOURCE}) → ${status || 'crash'}`,
    );
    if (!ok) console.log(child.stdout, child.stderr);
  }
  process.exit(failed ? 1 : 0);
}

/** Child process: serve one function and print the status of one request. */
async function runOne(file, path) {
  process.on('uncaughtException', (error) => {
    console.error(error);
    process.exit(1);
  });
  const { default: listener } = await import(file);
  const server = createServer((req, res) => void listener(req, res));
  await new Promise((done) => server.listen(0, done));
  const response = await fetch(`http://localhost:${server.address().port}${path}`, {
    headers: { 'x-vercel-oidc-token': 'smoke' },
  });
  await response.arrayBuffer();
  server.close();
  console.log(response.status);
}
