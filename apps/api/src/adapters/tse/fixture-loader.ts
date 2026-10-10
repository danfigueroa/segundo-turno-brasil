import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { TseFileLoader } from './tse-results-source';

/** Loads TSE files saved on disk as `<dir>/<scope>.json`. Used in tests and offline development. */
export function createFixtureLoader(dir: string): TseFileLoader {
  return async (scopeCode) => JSON.parse(await readFile(join(dir, `${scopeCode}.json`), 'utf8'));
}
