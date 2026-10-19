import { describe, expect, it } from 'vitest';
import { DEFAULT_I18N as pt } from '../../i18n/i18n';
import { loadI18n } from '../../i18n/load';
import { resultsResponse, tally } from '../../../test/fixtures';
import { finalistsOf } from '../../lib/finalists';
import { headlineOf, turnoutStats } from './headline';

describe('headlineOf', () => {
  const data = resultsResponse();
  const finalists = finalistsOf(data.country);

  it('shows vote shares and the margin for the country', () => {
    const headline = headlineOf(data, { kind: 'country' }, finalists, pt);
    expect(headline.title).toBe('Brasil');
    expect(headline.eyebrow).toBe('Presidente · 2º turno');
    expect(
      headline.columns.map((c) => [c.finalist.shortName, c.value.toFixed(2), c.leads]),
    ).toEqual([
      ['Lula', '49.18', false],
      ['Flávio', '50.82', true],
    ]);
    expect(headline.badge).toBe('Lidera');
    expect(headline.others).toEqual([]);
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

  it('speaks the language on screen', async () => {
    const en = await loadI18n('en');
    const headline = headlineOf(data, { kind: 'region', code: 'NE' }, finalists, en);
    expect(headline.title).toBe('Northeast region');
    expect(headline.eyebrow).toBe('President · Runoff · votes in the region');
    expect(headline.columns[0]?.note).toBe('PT · 6,300 votes');
    expect(headline.columns[0]?.states).toBe('Leads in 9 states');
    expect(headline.stats[0]).toEqual({ label: 'Margin', value: '40.00 pts', note: '3,600 votes' });
  });

  it('names the leader of a state', () => {
    const headline = headlineOf(data, { kind: 'state', code: 'BA' }, finalists, pt);
    expect(headline.eyebrow).toBe('Presidente · 2º turno · BA');
    expect(headline.stats[0]?.note).toBe('Lula à frente');
  });

  it('shows shares, votes and states won in a region', () => {
    const headline = headlineOf(data, { kind: 'region', code: 'NE' }, finalists, pt);
    expect(headline.title).toBe('Região Nordeste');
    expect(headline.eyebrow).toBe('Presidente · 2º turno · votos na região');
    expect(headline.columns.map((c) => [c.value.toFixed(2), c.note, c.states, c.leads])).toEqual([
      ['70.00', 'PT · 6.300 votos', 'Lidera em 9 estados', true],
      ['30.00', 'PL · 2.700 votos', 'Lidera em 0 estados', false],
    ]);
    expect(headline.stats[0]).toEqual({
      label: 'Diferença',
      value: '40,00 p.p.',
      note: '3.600 votos',
    });
  });

  it('counts the countries with votes abroad once they are loaded', () => {
    const voters = {
      electorate: 10,
      turnout: 6,
      ballots: { valid: 5, blank: 0, null: 1 },
      updatedAt: '2026-10-25T22:40:00-03:00',
    };
    const countries = [
      {
        name: 'Portugal',
        continent: 'EU' as const,
        votes: { '13': 3, '22': 1 },
        sections: { total: 1, counted: 1 },
        ...voters,
      },
      {
        name: 'Japão',
        continent: 'AS' as const,
        votes: { '13': 1, '22': 4 },
        sections: { total: 1, counted: 1 },
        ...voters,
      },
    ];
    expect(headlineOf(data, { kind: 'abroad' }, finalists, pt).stats[2]).toEqual({
      label: 'Países com votos',
      value: '—',
      note: '',
    });
    expect(headlineOf(data, { kind: 'abroad' }, finalists, pt, countries).stats[2]).toEqual({
      label: 'Países com votos',
      value: '2',
      note: '1 Lula · 1 Flávio',
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
    const headline = headlineOf(firstRound, { kind: 'country' }, finalistsOf(country), pt);
    expect(headline.badge).toBe('Mais votado');
    expect(headline.stats[1]).toEqual({ label: 'Demais candidatos', value: '8,00%', note: '' });
    expect(headline.bar.map((s) => s.weight)).toEqual([450, 80, 470]);
    expect(headline.others).toEqual([
      { number: '55', name: 'Ronaldo Caiado', party: 'PSD', share: 8, votes: 80 },
    ]);
  });

  it('reports abstention instead of the other candidates in the runoff', () => {
    expect(headlineOf(data, { kind: 'country' }, finalists, pt).stats[1]).toEqual({
      label: 'Abstenção',
      value: '20,00%',
      note: '200 eleitores',
    });
  });

  it('adds valid votes, turnout and blank plus null votes in every scope', () => {
    for (const selection of [
      { kind: 'country' },
      { kind: 'region', code: 'NE' },
      { kind: 'state', code: 'SP' },
      { kind: 'abroad' },
    ] as const) {
      expect(headlineOf(data, selection, finalists, pt).turnoutStats.map((s) => s.label)).toEqual([
        'Votos válidos',
        'Comparecimento',
        'Brancos e nulos',
      ]);
    }
  });
});

describe('turnoutStats', () => {
  it('measures valid, blank and null votes against the turnout', () => {
    const base = tally({ kind: 'country' }, 450, 470);
    expect(
      turnoutStats(
        {
          ...base,
          votes: { valid: 920, blank: 30, null: 50 },
          turnout: 1000,
          electorate: 1250,
        },
        pt,
      ),
    ).toEqual([
      { label: 'Votos válidos', value: '920', note: '92,00% do comparecimento' },
      { label: 'Comparecimento', value: '80,00%', note: '1.000 eleitores' },
      { label: 'Brancos e nulos', value: '8,00%', note: '80 votos' },
    ]);
  });

  it('measures turnout against the sections counted so far', () => {
    const base = tally({ kind: 'country' }, 450, 470);
    const halfCounted = { ...base, electorate: 2500, countedElectorate: 1250, turnout: 1000 };
    expect(turnoutStats(halfCounted, pt)[1]).toEqual({
      label: 'Comparecimento',
      value: '80,00%',
      note: '1.000 eleitores',
    });
    const data = resultsResponse({ country: halfCounted });
    expect(headlineOf(data, { kind: 'country' }, finalistsOf(halfCounted), pt).stats[1]).toEqual({
      label: 'Abstenção',
      value: '20,00%',
      note: '250 eleitores',
    });
  });

  it('abbreviates large valid vote counts', () => {
    const base = tally({ kind: 'country' }, 450, 470);
    const country = {
      ...base,
      votes: { valid: 119_300_788, blank: 1, null: 1 },
      turnout: 125_275_835,
      electorate: 158_000_000,
    };
    expect(turnoutStats(country, pt)[0]?.value).toBe('119,3 mi');
  });

  it('shows dashes before anyone has voted', () => {
    const empty = {
      ...tally({ kind: 'country' }, 0, 0, 0),
      electorate: 0,
      turnout: 0,
      votes: { valid: 0, blank: 0, null: 0 },
    };
    expect(turnoutStats(empty, pt).map((s) => [s.value, s.note])).toEqual([
      ['0', ''],
      ['—', '0 eleitores'],
      ['—', '0 votos'],
    ]);
  });
});
