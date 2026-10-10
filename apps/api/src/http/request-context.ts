import { AsyncLocalStorage } from 'node:async_hooks';

/** What the code running for a request may need from it, without passing it around. */
export interface RequestContext {
  /** Vercel OIDC token, sent by Vercel in the `x-vercel-oidc-token` header. */
  readonly oidcToken: string | undefined;
}

const storage = new AsyncLocalStorage<RequestContext>();

/** Runs `fn` (and everything it awaits) with the given request context. */
export function runWithRequestContext<T>(context: RequestContext, fn: () => T): T {
  return storage.run(context, fn);
}

/** OIDC token of the request being handled, if any. */
export function currentOidcToken(): string | undefined {
  return storage.getStore()?.oidcToken;
}
