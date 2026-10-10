import type { ResultsResponse } from '@stb/contracts';
import type { Round } from '@stb/domain';
import { parseSelectionPath, selectionPath, type Selection } from './selection';

/** Everything the URL hash encodes: which round and which scope. */
export interface View {
  /** `undefined` lets the app pick the round (see {@link resolveRound}). */
  readonly round: Round | undefined;
  readonly selection: Selection;
}

const ROUND_SEGMENTS: Readonly<Record<Round, string>> = { 1: '1turno', 2: '2turno' };

/** `#/1turno/sp` → round 1, São Paulo · `#/regiao/ne` → automatic round, Northeast. */
export function parseHash(hash: string): View {
  const path = hash.replace(/^#\/?/, '').toLowerCase();
  const [first = '', ...rest] = path.split('/');
  const round = first === ROUND_SEGMENTS[1] ? 1 : first === ROUND_SEGMENTS[2] ? 2 : undefined;
  return {
    round,
    selection: parseSelectionPath(round ? rest.join('/') : path),
  };
}

export function toHash({ round, selection }: View): string {
  const segments = [round ? ROUND_SEGMENTS[round] : '', selectionPath(selection)].filter(Boolean);
  return segments.length === 0 ? '' : `#/${segments.join('/')}`;
}

/**
 * The round to show: the one in the URL, otherwise the runoff once its count has
 * started, otherwise the first round — so the site is never empty before election night.
 */
export function resolveRound(
  explicit: Round | undefined,
  runoff: ResultsResponse | undefined,
): Round {
  if (explicit) return explicit;
  return runoff && runoff.country.sections.counted > 0 ? 2 : 1;
}
