import { useCallback, useSyncExternalStore } from 'react';
import { parseHash, toHash, type Selection } from './selection';

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

const getHash = () => window.location.hash;

/** Current selection, kept in the URL hash so links and the back button work. */
export function useSelection(): [Selection, (next: Selection) => void] {
  const hash = useSyncExternalStore(subscribe, getHash, () => '');
  const select = useCallback((next: Selection) => {
    const target = toHash(next);
    if (target === window.location.hash) return;
    if (target === '') {
      history.pushState(null, '', window.location.pathname + window.location.search);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } else {
      window.location.hash = target;
    }
  }, []);
  return [parseHash(hash), select];
}
