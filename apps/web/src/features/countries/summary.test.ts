import { describe, expect, it } from 'vitest';
import { resultsResponse, tally } from '../../../test/fixtures';
import { finalistsOf } from '../../lib/finalists';
import { abroadSummary } from './summary';

const finalists = finalistsOf(resultsResponse().country);
const abroad = { ...tally({ kind: 'abroad' }, 10, 20, 100), electorate: 1000, turnout: 373 };

describe('abroadSummary', () => {
  it('reads like the design, ties included', () => {
    expect(
      abroadSummary(
        { wins: { '13': 64, '22': 36 }, ties: ['Guiné-Bissau'] },
        finalists,
        abroad,
        true,
      ),
    ).toBe(
      'Lula venceu em 64 países, Flávio em 36 e houve 1 empate (Guiné-Bissau). Abstenção no exterior: 62,70%.',
    );
  });

  it('says who leads while counting, without ties', () => {
    expect(abroadSummary({ wins: { '13': 1, '22': 3 }, ties: [] }, finalists, abroad, false)).toBe(
      'Lula lidera em 1 país e Flávio em 3. Abstenção no exterior: 62,70%.',
    );
  });
});
