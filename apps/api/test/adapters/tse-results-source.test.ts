import { STATE_CODES } from '@stb/domain';
import { describe, expect, it } from 'vitest';
import { createFixtureLoader } from '../../src/adapters/tse/fixture-loader';
import { TseParseError, TseResultsSource } from '../../src/adapters/tse/tse-results-source';
import { FIRST_ROUND_2026 } from '../helpers';

describe('TseResultsSource', () => {
  it('builds a snapshot with the country, abroad and all 27 states', async () => {
    const source = new TseResultsSource(createFixtureLoader(FIRST_ROUND_2026));
    const snapshot = await source.fetchSnapshot();

    expect(snapshot.country.scope).toEqual({ kind: 'country' });
    expect(snapshot.abroad.scope).toEqual({ kind: 'abroad' });
    expect(Object.keys(snapshot.states).sort()).toEqual([...STATE_CODES].sort());
    expect(snapshot.states.SP.scope).toEqual({ kind: 'state', code: 'SP' });
  });

  it('has states and abroad adding up to the national valid votes', async () => {
    const snapshot = await new TseResultsSource(
      createFixtureLoader(FIRST_ROUND_2026),
    ).fetchSnapshot();
    const sum =
      Object.values(snapshot.states).reduce((acc, t) => acc + t.votes.valid, 0) +
      snapshot.abroad.votes.valid;
    expect(sum).toBe(snapshot.country.votes.valid);
  });

  it('reports which scope has an invalid file', async () => {
    const source = new TseResultsSource(async (code) => (code === 'sp' ? { foo: 1 } : {}));
    await expect(source.fetchSnapshot()).rejects.toBeInstanceOf(TseParseError);
  });
});
