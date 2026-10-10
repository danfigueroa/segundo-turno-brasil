import { describe, expect, it } from 'vitest';
import { SimulatedResultsSource } from '../../src/adapters/simulation/simulated-results-source';
import { createFixtureLoader } from '../../src/adapters/tse/fixture-loader';
import { TseResultsSource } from '../../src/adapters/tse/tse-results-source';
import { FIRST_ROUND_2026 } from '../helpers';

const inner = new TseResultsSource(createFixtureLoader(FIRST_ROUND_2026));

function simulationAt(elapsedMs: number) {
  return new SimulatedResultsSource(inner, {
    durationMs: 1000,
    startedAt: 0,
    now: () => elapsedMs,
  }).fetchSnapshot();
}

describe('SimulatedResultsSource', () => {
  it('starts with nothing counted', async () => {
    const snapshot = await simulationAt(0);
    expect(snapshot.country.sections.counted).toBe(0);
    expect(snapshot.country.votes.valid).toBe(0);
  });

  it('keeps only the two national front-runners', async () => {
    const snapshot = await simulationAt(500);
    expect(snapshot.country.candidates.map((c) => c.number).sort()).toEqual(['13', '22']);
    expect(snapshot.states.SP.candidates).toHaveLength(2);
  });

  it('progresses monotonically', async () => {
    const early = await simulationAt(200);
    const late = await simulationAt(600);
    expect(late.country.sections.counted).toBeGreaterThan(early.country.sections.counted);
  });

  it('ends with the real final votes of the finalists', async () => {
    const [snapshot, final] = await Promise.all([simulationAt(1000), inner.fetchSnapshot()]);
    expect(snapshot.country.sections.counted).toBe(final.country.sections.total);
    const votes = (t: typeof snapshot.country) =>
      Object.fromEntries(t.candidates.map((c) => [c.number, c.votes]));
    expect(votes(snapshot.country)).toEqual({
      '13': votes(final.country)['13'],
      '22': votes(final.country)['22'],
    });
  });
});
