import { useCallback, useSyncExternalStore } from 'react';

/** One `MediaQueryList` per query, shared: React reads the snapshot on every render. */
const lists = new Map<string, MediaQueryList | undefined>();

function listOf(query: string): MediaQueryList | undefined {
  if (!lists.has(query)) lists.set(query, window.matchMedia?.(query));
  return lists.get(query);
}

/** Whether a CSS media query matches, kept in sync as the viewport changes. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = listOf(query);
      list?.addEventListener('change', onChange);
      return () => list?.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => listOf(query)?.matches ?? false,
    () => false,
  );
}
