import type { ResultsResponse } from '@stb/contracts';
import {
  appendEntry,
  historyEntryOf,
  regionSeriesOf,
  sampleOf,
  seriesOf,
  type CountPoint,
  type HistoryEntry,
} from '@stb/domain';
import { resolveTally, type Selection } from '../../lib/selection';

/**
 * Runoff snapshots polled since the page opened. Kept at module level so switching
 * scopes or tabs does not lose them.
 */
let entries: readonly HistoryEntry[] = [];

/** Adds a polled runoff snapshot to the live history. */
export function recordLive(data: ResultsResponse): void {
  if (data.round === 2) entries = appendEntry(entries, historyEntryOf(data));
}

/** The live curve of a selection, ending with the snapshot on screen. */
export function liveSeries(data: ResultsResponse, selection: Selection): CountPoint[] {
  const series =
    selection.kind === 'country'
      ? seriesOf(entries, 'BR')
      : selection.kind === 'abroad' || selection.kind === 'abroadCountry'
        ? seriesOf(entries, 'ZZ')
        : selection.kind === 'state'
          ? seriesOf(entries, selection.code)
          : selection.kind === 'city'
            ? seriesOf(entries, selection.state)
            : regionSeriesOf(entries, selection.code);
  const tally = resolveTally(data, selection);
  return [...series, { at: tally.updatedAt, ...sampleOf(tally) }];
}

/** Forgets the live history (tests). */
export function resetLive(): void {
  entries = [];
}
