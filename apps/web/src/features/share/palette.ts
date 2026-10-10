import type { CandidateHue } from '../../lib/finalists';

/**
 * Share images use the light brand palette, whatever the sharer's theme, so every image
 * looks the same in a feed. Values mirror the light tokens in `styles/tokens.css`.
 */
export const SHARE_PALETTE = {
  background: '#f5f6f1',
  card: '#ffffff',
  text: '#0f1a14',
  secondary: '#56615a',
  onBrand: '#ffffff',
  brand: '#00843d',
  yellow: '#ffd60a',
  track: '#e3e6de',
  others: '#c9cec6',
  mapEmpty: '#daded5',
  /** Countries without Brazilian polling stations, on a continent map. */
  mapOther: '#e9ece4',
  /** Brazil, as a landmark on the map of the Americas. */
  mapBrazil: '#c4c9c0',
  mapStroke: '#ffffff',
  candidates: { red: '#d92d20', blue: '#1f5fd1' } satisfies Record<CandidateHue, string>,
  candidateText: { red: '#b42318', blue: '#1a4fb5' } satisfies Record<CandidateHue, string>,
  ramps: {
    red: ['#fce4e1', '#f7b9b1', '#ee8577', '#cf3b2c', '#a9231a'],
    blue: ['#e0e9fb', '#b3c8f2', '#7c9fe6', '#3d6ed3', '#1c45a3'],
  } satisfies Record<CandidateHue, readonly string[]>,
} as const;
