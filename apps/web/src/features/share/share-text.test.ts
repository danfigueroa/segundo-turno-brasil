import { describe, expect, it } from 'vitest';
import { DEFAULT_I18N as pt } from '../../i18n/i18n';
import { loadI18n } from '../../i18n/load';
import { finalistsOf } from '../../lib/finalists';
import { resultsResponse, tally } from '../../../test/fixtures';
import { shareContentFrom } from './share-content';
import { shareTextOf } from './share-text';

const data = resultsResponse();
const finalists = finalistsOf(data.country);

describe('shareTextOf', () => {
  it('writes the scoreboard of the scope as text with a link back', () => {
    const content = shareContentFrom(data, { kind: 'state', code: 'BA' }, finalists, pt, 'x');
    expect(shareTextOf(content, 'https://example.com/#/ba')).toBe(
      [
        '🗳️ Apuração do 2º turno · Bahia',
        '',
        '🔴 Lula: 70,00% (700 votos)',
        '🔵 Flávio Bolsonaro: 30,00% (300 votos)',
        '',
        '📊 50,00% das seções apuradas',
        '🕒 Atualizado às 19:42 · Fonte: TSE',
        '',
        'Acompanhe ao vivo: https://example.com/#/ba',
      ].join('\n'),
    );
  });

  it('writes in the language on screen', async () => {
    const en = await loadI18n('en');
    const content = shareContentFrom(data, { kind: 'abroad' }, finalists, en, 'x');
    expect(content.kicker).toBe('RUNOFF 2026 · LIVE COUNT');
    expect(shareTextOf(content, 'https://example.com/?lang=en#/exterior').split('\n')).toEqual([
      '🗳️ Runoff count · Other countries',
      '',
      expect.stringMatching(/^🔴 Lula: [\d.]+% \([\d,]+ votes?\)$/),
      expect.stringMatching(/^🔵 Flávio Bolsonaro: /),
      '',
      expect.stringMatching(/ of polling stations counted$/),
      expect.stringMatching(/^🕒 Updated at .* · Source: TSE$/),
      '',
      'Follow it live: https://example.com/?lang=en#/exterior',
    ]);
  });

  it('presents the first round as a final result', () => {
    const first = resultsResponse({ round: 1 });
    const content = shareContentFrom(
      first,
      { kind: 'country' },
      finalistsOf(first.country),
      pt,
      'x',
    );
    const text = shareTextOf(content, 'https://example.com/#/1turno');
    expect(text.startsWith('🗳️ Resultado do 1º turno · Brasil')).toBe(true);
    expect(text.endsWith('Veja: https://example.com/#/1turno')).toBe(true);
  });

  it('leads with the winner once the race is decided', () => {
    const decided = resultsResponse({ country: tally({ kind: 'country' }, 550, 250, 80) });
    const content = shareContentFrom(
      decided,
      { kind: 'country' },
      finalistsOf(decided.country),
      pt,
      'x',
    );
    expect(shareTextOf(content, 'https://example.com/').split('\n')[0]).toBe(
      '✅ Lula vence a eleição presidencial',
    );
  });
});
