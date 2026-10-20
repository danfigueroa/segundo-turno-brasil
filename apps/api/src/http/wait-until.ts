/** Where the Vercel runtime keeps the context of the request being handled. */
const REQUEST_CONTEXT = Symbol.for('@vercel/request-context');

interface RequestContextStore {
  get?: () => { waitUntil?: (task: Promise<unknown>) => void } | undefined;
}

/**
 * Keeps the function alive until `task` settles, after the response is sent: Vercel's
 * `waitUntil`, read the way `@vercel/functions` does. Off Vercel (dev server, tests) the
 * task simply runs on its own. `task` must handle its own errors.
 */
export function waitUntil(task: Promise<unknown>): void {
  const store: RequestContextStore | undefined = Reflect.get(globalThis, REQUEST_CONTEXT);
  store?.get?.()?.waitUntil?.(task);
}
