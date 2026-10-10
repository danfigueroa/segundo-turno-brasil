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

/** URL of the presidential (office 0001) results file of one scope. */
export function tseResultsUrl(baseUrl: string, electionCode: string, scopeCode: string): string {
  const election = electionCode.padStart(6, '0');
  return `${baseUrl}/${electionCode}/dados/${scopeCode}/${scopeCode}-c0001-e${election}-u.json`;
}

/** Loads TSE files over HTTP from the official results CDN. */
export function createHttpLoader(options: HttpLoaderOptions): TseFileLoader {
  const fetchFn = options.fetch ?? fetch;
  return async (scopeCode) => {
    const url = tseResultsUrl(options.baseUrl, options.electionCode, scopeCode);
    const response = await fetchFn(url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(options.timeoutMs),
    });
    if (!response.ok) throw new TseRequestError(url, response.status);
    return response.json();
  };
}
