import { STATE_CODES, type CountSample, type HistoryEntry, type HistoryScope } from '@stb/domain';
import { fileURLToPath } from 'node:url';

/** Real TSE files of the 2026 presidential first round (election 6257), final count. */
export const FIRST_ROUND_2026 = fileURLToPath(new URL('./fixtures/ele2026-6257', import.meta.url));

/** Official TSE files of the 2026 presidential runoff (election 6258), published before voting. */
export const RUNOFF_2026_BEFORE_COUNT = fileURLToPath(
  new URL('./fixtures/ele2026-6258-pre', import.meta.url),
);

/** A history entry where every scope has `counted` of 100 sections and one vote each. */
export function historyEntry(counted: number, at = '2026-10-25T18:00:00-03:00'): HistoryEntry {
  const sample: CountSample = { counted, total: 100, votes: { '13': counted, '22': 1 } };
  const states = Object.fromEntries(STATE_CODES.map((code) => [code, sample]));
  return {
    at,
    samples: { ...states, BR: sample, ZZ: sample } as Record<HistoryScope, CountSample>,
  };
}
