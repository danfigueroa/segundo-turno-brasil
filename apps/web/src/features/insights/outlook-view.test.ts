import { describe, expect, it } from 'vitest';
import { tally } from '../../../test/fixtures';
import { finalistsOf } from '../../lib/finalists';
import { outlookView } from './outlook-view';

const country = { kind: 'country' } as const;
const finalists = finalistsOf(tally(country, 10, 9));

describe('outlookView', () => {
  it('says how much of the remaining votes the runner-up needs', () => {
    // 600 × 700, 25 of 100 sections: ~3.900 valid votes left, 100 behind.
    const view = outlookView(tally(country, 600, 700, 25), finalists);
    expect(view).toMatchObject({
      decided: false,
      status: 'Em aberto',
      headline: 'Ainda dá virada',
      lead: 100,
      remaining: 3900,
    });
    expect(view?.leader.shortName).toBe('Flávio');
    expect(view?.sentence).toBe('Lula precisa de 51,28% dos votos válidos que faltam para virar.');
  });

  it('flags a race the remaining votes can no longer turn around', () => {
    // Electorate 1.000, turnout 800: at most 200 voters left, 500 behind.
    const view = outlookView(tally(country, 650, 150, 90), finalists);
    expect(view).toMatchObject({ decided: true, status: 'Decidido', needs: undefined });
    expect(view?.sentence).toContain(
      'Mesmo que todos os eleitores ainda não apurados votassem em Flávio',
    );
  });

  it('caps the need when the estimate leaves too few votes', () => {
    const live = { ...tally(country, 700, 100, 99), electorate: 100_000 };
    const view = outlookView(live, finalists);
    expect(view).toMatchObject({ decided: false, headline: 'Virada improvável', needs: 100 });
  });

  it('is hidden once the count is over or before votes and on a tie', () => {
    expect(outlookView(tally(country, 600, 400, 100), finalists)).toBeUndefined();
    expect(outlookView(tally(country, 0, 0, 0), finalists)).toBeUndefined();
    expect(outlookView(tally(country, 500, 500, 50), finalists)).toBeUndefined();
  });
});
