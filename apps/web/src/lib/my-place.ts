import { useCallback, useState } from 'react';
import { selectionPath, type Selection } from './selection';

/** The place a viewer pinned as theirs, as a URL path (`ba/2927408`) and its name. */
export interface MyPlace {
  readonly path: string;
  readonly label: string;
}

const KEY = 'stb:my-place';

/** States, cities and countries abroad can be pinned; the wider scopes are one tap away. */
export function isPinnable(selection: Selection): boolean {
  return (
    selection.kind === 'state' || selection.kind === 'city' || selection.kind === 'abroadCountry'
  );
}

/** What is pinned: "minha cidade", "meu estado" or "meu país". */
export function myPlaceKind(selection: Selection): 'city' | 'country' | 'state' {
  if (selection.kind === 'city') return 'city';
  if (selection.kind === 'abroadCountry') return 'country';
  return 'state';
}

export function myPlaceOf(selection: Selection, label: string): MyPlace {
  return { path: selectionPath(selection), label };
}

const isMyPlace = (value: unknown): value is MyPlace =>
  typeof value === 'object' &&
  value !== null &&
  'path' in value &&
  'label' in value &&
  typeof value.path === 'string' &&
  typeof value.label === 'string' &&
  value.label.length > 0;

/** The pinned place in this browser; `undefined` when none, or when storage is blocked. */
export function readMyPlace(): MyPlace | undefined {
  try {
    const raw = localStorage.getItem(KEY);
    const value: unknown = raw ? JSON.parse(raw) : undefined;
    return isMyPlace(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

/** Pins a place, or unpins with `undefined`. Silently does nothing without storage. */
export function writeMyPlace(place: MyPlace | undefined): void {
  try {
    if (place) localStorage.setItem(KEY, JSON.stringify(place));
    else localStorage.removeItem(KEY);
  } catch {
    // Private mode or blocked storage: the pin just lasts for this visit.
  }
}

/** The pinned place and a setter that also stores it. */
export function useMyPlace(): [MyPlace | undefined, (place: MyPlace | undefined) => void] {
  const [place, setPlace] = useState(readMyPlace);
  const update = useCallback((next: MyPlace | undefined) => {
    writeMyPlace(next);
    setPlace(next);
  }, []);
  return [place, update];
}
