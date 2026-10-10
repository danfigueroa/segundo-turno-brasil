import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { TseCityFiles } from './tse-cities-source';
import type { TseFileLoader } from './tse-results-source';

/** Loads TSE files saved on disk as `<dir>/<scope>.json`. Used in tests and offline development. */
export function createFixtureLoader(dir: string): TseFileLoader {
  return async (scopeCode) => JSON.parse(await readFile(join(dir, `${scopeCode}.json`), 'utf8'));
}

/**
 * The files of the breakdown by municipality saved on disk: `<dir>/cm.json` (municipality
 * list), `<dir>/<uf>-ab.json` (progress) and `<dir>/<scope>.json` (results).
 */
export function createFixtureCityFiles(dir: string): TseCityFiles {
  const load = createFixtureLoader(dir);
  return {
    municipalities: () => load('cm'),
    progress: (state) => load(`${state}-ab`),
    results: load,
  };
}
