import { fileURLToPath } from 'node:url';

/** Real TSE files of the 2026 presidential first round (election 6257), final count. */
export const FIRST_ROUND_2026 = fileURLToPath(new URL('./fixtures/ele2026-6257', import.meta.url));

/** Official TSE files of the 2026 presidential runoff (election 6258), published before voting. */
export const RUNOFF_2026_BEFORE_COUNT = fileURLToPath(
  new URL('./fixtures/ele2026-6258-pre', import.meta.url),
);
