import type { CandidateHue } from '../../lib/finalists';

/**
 * Share images always use the dark theme: it stands out in Stories feeds and keeps
 * the image identical regardless of the sharer's system theme. Values mirror the
 * dark tokens in `styles/tokens.css`.
 */
export const SHARE_PALETTE = {
  background: '#0d0d0d',
  text: '#f0efec',
  secondary: '#c3c2b7',
  muted: '#9a988f',
  track: '#2c2c2a',
  mapEmpty: '#383835',
  candidates: { red: '#e66767', blue: '#3987e5' } satisfies Record<CandidateHue, string>,
  ramps: {
    red: ['#4f2c2a', '#7a3532', '#b0403d', '#e05a58', '#f28b86'],
    blue: ['#26364d', '#2a4d7c', '#2f68b3', '#3987e5', '#7fb0f0'],
  } satisfies Record<CandidateHue, readonly string[]>,
} as const;
