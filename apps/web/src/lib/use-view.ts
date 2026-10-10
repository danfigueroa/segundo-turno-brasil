import { useCallback, useSyncExternalStore } from 'react';
import { parseHash, toHash, type View } from './view';

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

const getHash = () => window.location.hash;

/** Current view (round + scope), kept in the URL hash so links and the back button work. */
export function useView(): [View, (next: View) => void] {
  const hash = useSyncExternalStore(subscribe, getHash, () => '');
  const navigate = useCallback((next: View) => {
    const target = toHash(next);
    if (target === window.location.hash) return;
    if (target === '') {
      history.pushState(null, '', window.location.pathname + window.location.search);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } else {
      window.location.hash = target;
    }
  }, []);
  return [parseHash(hash), navigate];
}
