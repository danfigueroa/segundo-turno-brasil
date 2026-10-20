import type { Round } from '@stb/domain';

export type Handler = (request: Request) => Promise<Response>;

/** Rounds whose results are final and no longer change. */
export const FINAL_ROUNDS: ReadonlySet<Round> = new Set([1]);

/** `?round=1|2`, defaulting to the runoff; `undefined` for anything else. */
export function parseRound(request: Request): Round | undefined {
  const value = new URL(request.url).searchParams.get('round') ?? '2';
  if (value === '1') return 1;
  if (value === '2') return 2;
  return undefined;
}

/**
 * Error message when the query string repeats a parameter or has one outside `allowed`
 * (Vercel's own `x-vercel-*` aside): each variant is a CDN cache key of its own, so
 * accepting them would let anyone skip the cache and reach the function (ADR 0031).
 */
export function unexpectedParam(request: Request, allowed: readonly string[]): string | undefined {
  const seen = new Set<string>();
  for (const key of new URL(request.url).searchParams.keys()) {
    if (key.startsWith('x-vercel-')) continue;
    if (!allowed.includes(key) || seen.has(key)) return `unexpected query parameter: ${key}`;
    seen.add(key);
  }
  return undefined;
}

export const noStore = (status: number, error: string, headers: Record<string, string> = {}) =>
  Response.json({ error }, { status, headers: { 'cache-control': 'no-store', ...headers } });
