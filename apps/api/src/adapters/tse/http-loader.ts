import type { TseCityFiles } from './tse-cities-source';
import type { TseFileLoader } from './tse-results-source';

export interface HttpLoaderOptions {
  /** Election cycle base URL, e.g. `https://resultados.tse.jus.br/oficial/ele2026`. */
  readonly baseUrl: string;
  /** TSE election code, e.g. `6258` for the 2026 presidential runoff. */
  readonly electionCode: string;
  readonly timeoutMs: number;
  readonly fetch?: typeof fetch;
}

export class TseRequestError extends Error {
  constructor(
    readonly url: string,
    readonly status: number,
  ) {
    super(`TSE responded ${status} for ${url}`);
    this.name = 'TseRequestError';
  }
}

/**
 * URL of the presidential (office 0001) results file of one scope. Files live in the
 * folder of their state (or `br`/`zz`): a city abroad, `zz29254`, is under `zz/`.
 */
export function tseResultsUrl(baseUrl: string, electionCode: string, scopeCode: string): string {
  const election = electionCode.padStart(6, '0');
  const folder = scopeCode.slice(0, 2);
  return `${baseUrl}/${electionCode}/dados/${folder}/${scopeCode}-c0001-e${election}-u.json`;
}

/** Municipalities of every scope, with their IBGE codes. */
export function tseMunicipalitiesUrl(baseUrl: string, electionCode: string): string {
  return `${baseUrl}/${electionCode}/config/mun-e${electionCode.padStart(6, '0')}-cm.json`;
}

/** Count progress of every municipality of a state (lowercase code). */
export function tseProgressUrl(baseUrl: string, electionCode: string, state: string): string {
  return `${baseUrl}/${electionCode}/dados/${state}/${state}-e${electionCode.padStart(6, '0')}-ab.json`;
}

function jsonFetcher(options: HttpLoaderOptions): (url: string) => Promise<unknown> {
  const fetchFn = options.fetch ?? fetch;
  return async (url) => {
    const response = await fetchFn(url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(options.timeoutMs),
    });
    if (!response.ok) throw new TseRequestError(url, response.status);
    return response.json();
  };
}

/** Loads TSE files over HTTP from the official results CDN. */
export function createHttpLoader(options: HttpLoaderOptions): TseFileLoader {
  const get = jsonFetcher(options);
  return (scopeCode) => get(tseResultsUrl(options.baseUrl, options.electionCode, scopeCode));
}

/** The files of the breakdown by municipality, over HTTP from the official results CDN. */
export function createHttpCityFiles(options: HttpLoaderOptions): TseCityFiles {
  const get = jsonFetcher(options);
  const { baseUrl, electionCode } = options;
  return {
    municipalities: () => get(tseMunicipalitiesUrl(baseUrl, electionCode)),
    progress: (state) => get(tseProgressUrl(baseUrl, electionCode, state)),
    results: (scope) => get(tseResultsUrl(baseUrl, electionCode, scope)),
  };
}
