import { describe, expect, it } from 'vitest';
import { finalistsOf } from '../../lib/finalists';
import { citiesResponse, resultsResponse, tally } from '../../../test/fixtures';
import { SHARE_PALETTE } from './palette';
import { shareContentFrom } from './share-content';

const data = resultsResponse();
const finalists = finalistsOf(data.country);

describe('shareContentFrom', () => {
  it('summarizes the national result', () => {
    const content = shareContentFrom(data, { kind: 'country' }, finalists, 'example.com');
    expect(content.title).toBe('Brasil');
    expect(content.kicker).toBe('2º TURNO 2026 · APURAÇÃO AO VIVO');
    expect(content.leaderNumber).toBe('22');
    expect(content.counted).toBe(50);
    expect(content.notes).toEqual(['Diferença: 1,64 p.p.', '']);
    expect(content.source).toBe('Atualizado às 19:42 · Fonte: TSE');
    expect(content.focus.size).toBe(27);
    expect(content.siteUrl).toBe('example.com');
  });

  it('colors each state by leader and margin', () => {
    const content = shareContentFrom(data, { kind: 'country' }, finalists, 'example.com');
    // Bahia: Lula 70% x 30% and São Paulo: Flávio 60% x 40% are both 20+ p.p. margins.
    expect(content.mapFills.BA).toBe(SHARE_PALETTE.ramps.red[4]);
    expect(content.mapFills.SP).toBe(SHARE_PALETTE.ramps.blue[4]);
  });

  it('counts the states each finalist leads, naming the Federal District apart', () => {
    const content = shareContentFrom(data, { kind: 'country' }, finalists, 'x');
    expect(content.leadCounts.map((c) => [c.label, c.value])).toEqual([
      ['Lula lidera em', '9 estados'],
      ['Flávio lidera em', '17 estados + DF'],
    ]);
  });

  it('focuses on the selected region or state', () => {
    const region = shareContentFrom(data, { kind: 'region', code: 'S' }, finalists, 'x');
    expect([...region.focus].sort()).toEqual(['PR', 'RS', 'SC']);
    expect(region.leadCounts[1]?.value).toBe('3 estados');
    const state = shareContentFrom(data, { kind: 'state', code: 'BA' }, finalists, 'x');
    expect(state.title).toBe('Bahia');
    expect(state.leaderNumber).toBe('13');
    expect([...state.focus]).toEqual(['BA']);
  });

  it('reports the others and the final time in the first round', () => {
    const country = {
      ...tally({ kind: 'country' }, 450, 470, 100),
      candidates: [
        { number: '22', name: 'FLAVIO BOLSONARO', party: 'PL', votes: 470, share: 47 },
        { number: '13', name: 'LULA', party: 'PT', votes: 450, share: 45 },
        { number: '55', name: 'RONALDO CAIADO', party: 'PSD', votes: 80, share: 8 },
      ],
    };
    const content = shareContentFrom(
      resultsResponse({ round: 1, country }),
      { kind: 'country' },
      finalistsOf(country),
      'x',
    );
    expect(content.kicker).toBe('1º TURNO 2026 · RESULTADO FINAL');
    expect(content.othersVotes).toBe(80);
    expect(content.notes[1]).toBe('Demais candidatos: 8,00%');
    expect(content.source).toBe('Fonte: TSE · 25/10, 19:42');
  });

  it("draws a city on its state's municipal map, outlined", () => {
    const salvador = { kind: 'city', state: 'BA', ibge: '2927408' } as const;
    const map = {
      viewBox: '0 0 10 10',
      cities: { '2927408': 'M0,0L1,1Z', '2903201': 'M2,2L3,3Z', '2900108': 'M4,4L5,5Z' },
    };
    const { cities } = citiesResponse();
    const content = shareContentFrom(data, salvador, finalists, 'x', { cities, map });
    expect(content.title).toBe('Salvador');
    expect(content.cityMap?.selected).toBe('M0,0L1,1Z');
    // Numeric keys come in IBGE order: a municipality without results is drawn empty.
    expect(content.cityMap?.shapes.map((s) => s.fill)).toEqual([
      SHARE_PALETTE.mapEmpty,
      SHARE_PALETTE.ramps.blue[4],
      SHARE_PALETTE.ramps.red[4],
    ]);
    expect(content.leadCounts.map((c) => [c.label, c.value])).toEqual([
      ['Lula lidera em', '2 cidades'],
      ['Flávio lidera em', '1 cidade'],
    ]);
  });

  it('shares a city like its state until its details load', () => {
    const salvador = { kind: 'city', state: 'BA', ibge: '2927408' } as const;
    const content = shareContentFrom(data, salvador, finalists, 'x');
    expect(content.cityMap).toBeUndefined();
    expect([...content.focus]).toEqual(['BA']);
  });
});
