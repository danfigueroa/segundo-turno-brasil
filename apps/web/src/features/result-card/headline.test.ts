import { describe, expect, it } from 'vitest';
import { resultsResponse, tally } from '../../../test/fixtures';
import { finalistsOf } from '../../lib/finalists';
import { headlineOf } from './headline';

describe('headlineOf', () => {
  const data = resultsResponse();
  const finalists = finalistsOf(data.country);

  it('shows vote shares and the margin for the country', () => {
    const headline = headlineOf(data, { kind: 'country' }, finalists);
    expect(headline.title).toBe('Brasil');
    expect(headline.eyebrow).toBe('Presidente · 2º turno');
    expect(
      headline.columns.map((c) => [c.finalist.shortName, c.value.toFixed(2), c.leads]),
    ).toEqual([
      ['Lula', '49.18', false],
      ['Flávio', '50.82', true],
    ]);
    expect(headline.badge).toBe('Lidera');
    expect(headline.stats[0]).toEqual({
      label: 'Diferença',
      value: '1,64 p.p.',
      note: '400 votos',
    });
    expect(headline.stats[2]).toEqual({
      label: 'Seções apuradas',
      value: '50,00%',
      note: '50 de 100',
    });
  });

  it('names the leader of a state', () => {
    const headline = headlineOf(data, { kind: 'state', code: 'BA' }, finalists);
    expect(headline.eyebrow).toBe('Presidente · 2º turno · BA');
    expect(headline.stats[0]?.note).toBe('Lula à frente');
  });

  it('counts the states each finalist leads in a region', () => {
    const headline = headlineOf(data, { kind: 'region', code: 'NE' }, finalists);
    expect(headline.title).toBe('Região Nordeste');
    expect(headline.columns.map((c) => [c.value, c.note, c.leads])).toEqual([
      [9, 'estados', true],
      [0, 'estados', false],
    ]);
    expect(headline.badge).toBe('Lidera mais');
    expect(headline.stats[1]).toEqual({
      label: 'Maior vantagem',
      value: '40,00 p.p.',
      note: 'Lula · AL',
    });
  });

  it('reports the other candidates in the first round', () => {
    const country = {
      ...tally({ kind: 'country' }, 450, 470, 100),
      candidates: [
        { number: '22', name: 'FLAVIO BOLSONARO', party: 'PL', votes: 470, share: 47 },
        { number: '13', name: 'LULA', party: 'PT', votes: 450, share: 45 },
        { number: '55', name: 'RONALDO CAIADO', party: 'PSD', votes: 80, share: 8 },
      ],
    };
    const firstRound = resultsResponse({ round: 1, country });
    const headline = headlineOf(firstRound, { kind: 'country' }, finalistsOf(country));
    expect(headline.badge).toBe('Mais votado');
    expect(headline.stats[1]).toEqual({ label: 'Demais candidatos', value: '8,00%', note: '' });
    expect(headline.bar.map((s) => s.weight)).toEqual([450, 80, 470]);
  });
});
