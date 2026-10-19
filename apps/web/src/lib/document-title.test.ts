import { describe, expect, it } from 'vitest';
import { tally } from '../../test/fixtures';
import { DEFAULT_I18N as pt } from '../i18n/i18n';
import { loadI18n } from '../i18n/load';
import { documentTitle } from './document-title';
import { finalistsOf } from './finalists';

const country = tally({ kind: 'country' }, 600, 400, 87);
const finalists = finalistsOf(country);

describe('documentTitle', () => {
  it('shows the score and the count of Brazil', () => {
    expect(documentTitle(country, finalists, undefined, pt)).toBe(
      'Lula 60,00% × 40,00% Flávio · 87,00% apurado',
    );
  });

  it('names any other place', () => {
    const bahia = tally({ kind: 'state', code: 'BA' }, 700, 300, 100);
    expect(documentTitle(bahia, finalists, 'Bahia', pt)).toBe(
      'Bahia: Lula 70,00% × 30,00% Flávio · 100% apurado',
    );
  });

  it('keeps the site title before any vote is counted', () => {
    expect(documentTitle(tally({ kind: 'country' }, 0, 0, 0), finalists, undefined, pt)).toBe(
      'Segundo Turno 2026 · Apuração ao vivo',
    );
  });

  it('speaks the language on screen', async () => {
    expect(documentTitle(country, finalists, undefined, await loadI18n('en'))).toBe(
      'Lula 60.00% × 40.00% Flávio · 87.00% counted',
    );
  });
});
