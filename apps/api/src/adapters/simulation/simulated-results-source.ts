import { aggregate, rankCandidates, STATE_CODES, type StateCode, type Tally } from '@stb/domain';
import type { ElectionSnapshot, ResultsSource } from '../../ports/results-source';

export interface SimulationOptions {
  /** How long it takes for every state to reach 100% counted. */
  readonly durationMs: number;
  readonly startedAt: number;
  readonly now?: () => number;
}

/**
 * Replays final results as if the count were happening live, so the UI can be developed
 * against changing data. Keeps only the two national front-runners, mimicking a runoff.
 * Each state progresses at its own speed and early counts are tilted towards one
 * candidate, converging to the real final result when the simulation ends.
 */
export class SimulatedResultsSource implements ResultsSource {
  private finalResults: Promise<ElectionSnapshot> | undefined;

  constructor(
    private readonly inner: ResultsSource,
    private readonly options: SimulationOptions,
  ) {}

  async fetchSnapshot(): Promise<ElectionSnapshot> {
    this.finalResults ??= this.inner.fetchSnapshot();
    const final = await this.finalResults;

    const now = (this.options.now ?? Date.now)();
    const elapsed = clamp((now - this.options.startedAt) / this.options.durationMs);
    const finalists = new Set(final.country.candidates.slice(0, 2).map((c) => c.number));
    const updatedAt = new Date(now).toISOString();

    const replay = (tally: Tally, key: string) =>
      replayTally(tally, progressOf(key, elapsed), tiltOf(key), finalists, updatedAt);

    const states = Object.fromEntries(
      STATE_CODES.map((code) => [code, replay(final.states[code], code)]),
    ) as Record<StateCode, Tally>;
    const abroad = replay(final.abroad, 'ZZ');
    const country = aggregate({ kind: 'country' }, [...Object.values(states), abroad]);

    return { country, states, abroad };
  }
}

function replayTally(
  tally: Tally,
  progress: number,
  tilt: number,
  finalists: ReadonlySet<string>,
  updatedAt: string,
): Tally {
  const candidates = rankCandidates(
    tally.candidates
      .filter((c) => finalists.has(c.number))
      .map((c, index) => {
        const bias = 1 + tilt * (1 - progress) * (index === 0 ? 1 : -1);
        return { ...c, votes: Math.round(c.votes * progress * bias) };
      }),
  );
  const scale = (value: number) => Math.round(value * progress);
  return {
    ...tally,
    candidates,
    sections: { total: tally.sections.total, counted: scale(tally.sections.total) },
    turnout: scale(tally.turnout),
    votes: {
      valid: candidates.reduce((sum, c) => sum + c.votes, 0),
      blank: scale(tally.votes.blank),
      null: scale(tally.votes.null),
    },
    updatedAt,
  };
}

export function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function hash(key: string): number {
  return [...key].reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 9973, 7);
}

/** Each scope counts 1x–2x faster than the simulation clock, finishing by the end. */
export function progressOf(key: string, elapsed: number): number {
  return clamp(elapsed * (1 + (hash(key) % 100) / 100));
}

/** Early-count bias between -0.25 and +0.25, fading out as counting progresses. */
export function tiltOf(key: string): number {
  return ((hash(key) % 51) - 25) / 100;
}
