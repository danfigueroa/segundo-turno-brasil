import type { ResultsResponse } from '@stb/contracts';
import { STATE_CODES, STATES, statesInRegion, type StateCode } from '@stb/domain';
import { finalistResults, type Finalist } from '../../lib/finalists';
import type { I18n } from '../../i18n/i18n';
import { ABROAD, regionOf, type Selection } from '../../lib/selection';

export interface MarginRow {
  /** UF code, or `EXT` for abroad. */
  readonly code: string;
  readonly name: string;
  readonly target: Selection;
  /** Votes of the first finalist minus the second (display order): > 0 favors the first. */
  readonly margin: number;
}

export interface NetMargins {
  /** Widest margins first. */
  readonly rows: readonly MarginRow[];
  /** Sum of the rows' margins. */
  readonly total: number;
  /** Widest absolute margin, the full length of a bar. */
  readonly scale: number;
}

function marginOf(data: ResultsResponse, finalists: readonly Finalist[], code: StateCode | 'ZZ') {
  const tally = code === 'ZZ' ? data.abroad : data.states[code];
  const [first, second] = finalistResults(tally, finalists);
  return (first?.votes ?? 0) - (second?.votes ?? 0);
}

/**
 * Net votes each place adds to one finalist's lead: every state plus abroad nationally,
 * or the states of the selected region (or of the selected state's region).
 */
export function netMargins(
  data: ResultsResponse,
  finalists: readonly Finalist[],
  selection: Selection,
  i18n: I18n,
): NetMargins {
  const region = regionOf(selection);
  const codes = region ? statesInRegion(region) : STATE_CODES;
  const rows: MarginRow[] = codes.map((code) => ({
    code,
    name: STATES[code].name,
    target: { kind: 'state', code },
    margin: marginOf(data, finalists, code),
  }));
  if (!region) {
    rows.push({
      code: 'EXT',
      name: i18n.m.places.abroad,
      target: ABROAD,
      margin: marginOf(data, finalists, 'ZZ'),
    });
  }
  rows.sort((a, b) => Math.abs(b.margin) - Math.abs(a.margin) || a.name.localeCompare(b.name));
  return {
    rows,
    total: rows.reduce((sum, r) => sum + r.margin, 0),
    scale: rows.reduce((max, r) => Math.max(max, Math.abs(r.margin)), 0),
  };
}
