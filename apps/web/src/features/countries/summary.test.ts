import { describe, expect, it } from 'vitest';
import { DEFAULT_I18N as pt } from '../../i18n/i18n';
import { loadI18n } from '../../i18n/load';
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
        pt,
      ),
    ).toBe(
      'Lula venceu em 64 países, Flávio em 36 e houve 1 empate (Guiné-Bissau). Abstenção no exterior: 62,70%.',
    );
  });

  it('says who leads while counting, without ties', () => {
    expect(
      abroadSummary({ wins: { '13': 1, '22': 3 }, ties: [] }, finalists, abroad, false, pt),
    ).toBe('Lula lidera em 1 país e Flávio em 3. Abstenção no exterior: 62,70%.');
  });

  it('speaks the language on screen', async () => {
    const en = await loadI18n('en');
    const standings = { wins: { '13': 64, '22': 36 }, ties: ['Holanda', 'Japão'] };
    expect(abroadSummary(standings, finalists, abroad, true, en)).toBe(
      'Lula won in 64 countries, Flávio in 36, and there were 2 ties (Netherlands and Japan). Abstention abroad: 62.70%.',
    );
  });
});
