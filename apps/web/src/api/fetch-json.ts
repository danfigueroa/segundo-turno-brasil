export class ResultsUnavailableError extends Error {
  constructor(readonly status: number) {
    super(`Results API responded ${status}`);
    this.name = 'ResultsUnavailableError';
  }
}

/**
 * Fetcher of one kind of API response, validated by `parse`. When the response carries
 * the ETag of the last one from the same URL (the browser turned the CDN's 304 into the
 * cached body), the value already parsed is returned as is: no JSON parse, no validation,
 * and the same object, so a poll without news changes nothing on screen (ADR 0020).
 */
export function createJsonFetcher<T>(
  parse: (value: unknown) => T,
): (url: string, signal?: AbortSignal) => Promise<T> {
  const last = new Map<string, { readonly etag: string; readonly value: T }>();
  return async (url, signal) => {
    const response = await fetch(url, {
      headers: { accept: 'application/json' },
      ...(signal ? { signal } : {}),
    });
    if (!response.ok) throw new ResultsUnavailableError(response.status);
    const etag = response.headers.get('etag');
    const known = last.get(url);
    if (etag && known?.etag === etag) {
      void response.body?.cancel();
      return known.value;
    }
    const value = parse(await response.json());
    if (etag) last.set(url, { etag, value });
    return value;
  };
}
