import { RUNOFF_COUNT_START } from '../features/countdown/countdown';

/** Longer than the CDN cache (s-maxage=15), so each poll can bring new data; 60s keeps edge requests low (ADR 0028). */
export const POLL_INTERVAL_MS = 60_000;

/** Before the count starts and on embeds, where nobody is waiting for the next batch (ADR 0031). */
export const SLOW_POLL_INTERVAL_MS = 120_000;

/**
 * How long live data counts as fresh: below the poll interval, so polling is unchanged,
 * but returning to the tab or to a scope seen moments ago reuses it (ADR 0031).
 */
export const LIVE_STALE_TIME_MS = 45_000;

export interface Sections {
  readonly total: number;
  readonly counted: number;
}

/** Options of the hooks of live data (results, cities, abroad). */
export interface LiveOptions {
  readonly enabled?: boolean;
  /** Poll at the slow pace (embeds). */
  readonly slow?: boolean;
  /** Stop the runoff queries for now (an embed scrolled out of view). */
  readonly paused?: boolean;
}

export interface PollOptions {
  /** Poll at the slow pace, as an embed does. */
  readonly slow?: boolean;
  readonly now?: number;
}

/**
 * Interval of a live query: `false` once every section of the scope is counted (the data
 * no longer changes), slower before the count starts, every minute otherwise.
 */
export function pollIntervalOf(
  sections: Sections | undefined,
  { slow = false, now = Date.now() }: PollOptions = {},
): number | false {
  if (sections && sections.total > 0 && sections.counted >= sections.total) return false;
  const beforeCount = (sections?.counted ?? 0) === 0 && now < Date.parse(RUNOFF_COUNT_START);
  return slow || beforeCount ? SLOW_POLL_INTERVAL_MS : POLL_INTERVAL_MS;
}

/** Sections of a list of places added up (municipalities of a state, countries abroad). */
export function sectionsOf(places: readonly { readonly sections: Sections }[]): Sections {
  let total = 0;
  let counted = 0;
  for (const { sections } of places) {
    total += sections.total;
    counted += sections.counted;
  }
  return { total, counted };
}
