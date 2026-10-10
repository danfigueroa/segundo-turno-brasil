import { statesInRegion, type RegionCode, type StateCode } from './states';
import type { Tally } from './tally';

/** Scopes kept in the count history: Brazil, abroad and each state. */
export type HistoryScope = 'BR' | 'ZZ' | StateCode;

/** Progress of the count in one scope at one moment. */
export interface CountSample {
  readonly counted: number;
  readonly total: number;
  /** Votes by ballot number. */
  readonly votes: Readonly<Record<string, number>>;
}

/** Every scope at one moment of the count. */
export interface HistoryEntry {
  /** ISO 8601 timestamp of the TSE totalization. */
  readonly at: string;
  readonly samples: Readonly<Record<HistoryScope, CountSample>>;
}

/** One scope at one moment, as plotted by the count curve. */
export interface CountPoint extends CountSample {
  readonly at: string;
}

export function sampleOf(tally: Tally): CountSample {
  return {
    counted: tally.sections.counted,
    total: tally.sections.total,
    votes: Object.fromEntries(tally.candidates.map((c) => [c.number, c.votes])),
  };
}

/** A history entry from a snapshot of every scope, timed by the national totalization. */
export function historyEntryOf(snapshot: {
  readonly country: Tally;
  readonly states: Readonly<Record<StateCode, Tally>>;
  readonly abroad: Tally;
}): HistoryEntry {
  const states = Object.entries(snapshot.states).map(([code, tally]) => [code, sampleOf(tally)]);
  return {
    at: snapshot.country.updatedAt,
    samples: {
      ...Object.fromEntries(states),
      BR: sampleOf(snapshot.country),
      ZZ: sampleOf(snapshot.abroad),
    } as Record<HistoryScope, CountSample>,
  };
}

/**
 * Appends an entry only when the national count moved forward, so repeated or
 * out-of-order snapshots never add points. Returns the same array when nothing changed.
 */
export function appendEntry(
  entries: readonly HistoryEntry[],
  entry: HistoryEntry,
): readonly HistoryEntry[] {
  const last = entries.at(-1);
  if (entry.samples.BR.counted === 0) return entries;
  if (last && entry.samples.BR.counted <= last.samples.BR.counted) return entries;
  return [...entries, entry];
}

/** The count curve of one scope. */
export function seriesOf(entries: readonly HistoryEntry[], scope: HistoryScope): CountPoint[] {
  return entries.map((entry) => ({ at: entry.at, ...entry.samples[scope] }));
}

/** The count curve of a region: its states summed at each moment. */
export function regionSeriesOf(entries: readonly HistoryEntry[], region: RegionCode): CountPoint[] {
  const codes = statesInRegion(region);
  return entries.map((entry) => {
    const votes: Record<string, number> = {};
    let counted = 0;
    let total = 0;
    for (const code of codes) {
      const sample = entry.samples[code];
      counted += sample.counted;
      total += sample.total;
      for (const [number, v] of Object.entries(sample.votes))
        votes[number] = (votes[number] ?? 0) + v;
    }
    return { at: entry.at, counted, total, votes };
  });
}

/** How fast sections are being counted. */
export interface Pace {
  readonly sectionsPerMinute: number;
  readonly remainingSections: number;
  /** ISO 8601 estimate of when the count reaches 100%; `undefined` if done or stalled. */
  readonly eta: string | undefined;
}

/**
 * Counting pace over the last `windowMinutes` of the curve (at least the last two
 * points). `undefined` with fewer than two points.
 */
export function paceOf(points: readonly CountPoint[], windowMinutes = 10): Pace | undefined {
  const last = points.at(-1);
  if (!last || points.length < 2) return undefined;
  const lastMs = Date.parse(last.at);
  const since = lastMs - windowMinutes * 60_000;
  const first = points.find((p) => Date.parse(p.at) >= since && p !== last) ?? points.at(-2);
  if (!first) return undefined;

  const minutes = (lastMs - Date.parse(first.at)) / 60_000;
  const sectionsPerMinute = minutes > 0 ? (last.counted - first.counted) / minutes : 0;
  const remainingSections = Math.max(0, last.total - last.counted);
  const eta =
    remainingSections > 0 && sectionsPerMinute > 0
      ? new Date(lastMs + (remainingSections / sectionsPerMinute) * 60_000).toISOString()
      : undefined;
  return { sectionsPerMinute, remainingSections, eta };
}
