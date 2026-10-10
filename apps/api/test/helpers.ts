import { fileURLToPath } from 'node:url';

/** Real TSE files of the 2026 presidential first round (election 6257), final count. */
export const FIRST_ROUND_2026 = fileURLToPath(new URL('./fixtures/ele2026-6257', import.meta.url));
