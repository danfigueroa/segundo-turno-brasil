import { describe, expect, it } from 'vitest';
import { resultsResponse, tally } from '../../test/fixtures';
import { finalistsOf } from './finalists';
import { winnerOf } from './winner';

describe('winnerOf', () => {
  it('names the leader once the runner-up can no longer overtake', () => {
    // 800 of 1000 voters counted, 300 votes ahead: the 200 left cannot turn it around.
    const data = resultsResponse({ country: tally({ kind: 'country' }, 550, 250, 80) });
    expect(winnerOf(data, finalistsOf(data.country))?.shortName).toBe('Lula');
  });

  it('waits while the race is open', () => {
    const data = resultsResponse({ country: tally({ kind: 'country' }, 450, 350, 80) });
    expect(winnerOf(data, finalistsOf(data.country))).toBeUndefined();
  });

  it('names a winner when the count is over', () => {
    const data = resultsResponse({ country: tally({ kind: 'country' }, 410, 390, 100) });
    expect(winnerOf(data, finalistsOf(data.country))?.shortName).toBe('Lula');
  });

  it('never names one in the first round', () => {
    const data = resultsResponse({ round: 1, country: tally({ kind: 'country' }, 550, 250, 100) });
    expect(winnerOf(data, finalistsOf(data.country))).toBeUndefined();
  });
});
