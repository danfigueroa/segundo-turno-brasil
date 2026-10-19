/** Polls close and the runoff count starts at 17h in Brasília. */
export const RUNOFF_COUNT_START = '2026-10-25T17:00:00-03:00';

export interface CountdownPart {
  readonly value: string;
  readonly unit: 'days' | 'hours' | 'minutes' | 'seconds';
}

const pad = (value: number) => String(value).padStart(2, '0');

/** Days, hours, minutes and seconds left until `target`, never negative. */
export function countdownParts(target: string, now: number): CountdownPart[] {
  const seconds = Math.max(0, Math.floor((Date.parse(target) - now) / 1000));
  return [
    { value: pad(Math.floor(seconds / 86_400)), unit: 'days' },
    { value: pad(Math.floor((seconds % 86_400) / 3600)), unit: 'hours' },
    { value: pad(Math.floor((seconds % 3600) / 60)), unit: 'minutes' },
    { value: pad(seconds % 60), unit: 'seconds' },
  ];
}
