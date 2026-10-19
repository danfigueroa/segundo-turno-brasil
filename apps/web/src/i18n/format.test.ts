import { describe, expect, it } from 'vitest';
import { createFormat } from './format';

const pt = createFormat('pt-BR', { points: 'p.p.' });
const en = createFormat('en', { points: 'pts' });
const de = createFormat('de', { points: 'Pp.' });
const ja = createFormat('ja', { points: 'pt' });

describe('createFormat', () => {
  it('keeps the Brazilian formats', () => {
    expect(pt.percent(47.027772)).toBe('47,03%');
    expect(pt.counted(87.4)).toBe('87,40%');
    expect(pt.counted(100)).toBe('100%');
    expect(pt.votes(56104503)).toBe('56.104.503');
    expect(pt.lead(2.345)).toBe('+2,3');
    expect(pt.lead(2.345, 2)).toBe('+2,35');
    expect(pt.points(2.5)).toBe('2,50 p.p.');
    expect(pt.pointsChange(-1)).toBe('−1,00 p.p.');
    expect(pt.compactVotes(1_234_567)).toBe('1,2 mi');
    expect(pt.compactVotes(45_600)).toBe('46 mil');
    expect(pt.compactVotes(9_870)).toBe('9.870');
    expect(pt.compactVotes(999_600)).toBe('1,0 mi');
    expect(pt.compactVotes(-2_500_000)).toBe('-2,5 mi');
    expect(pt.pointsChange(2.5)).toBe('+2,50 p.p.');
    expect(pt.pointsChange(0)).toBe('0,00 p.p.');
    expect(pt.date('2026-10-05T02:00:00Z')).toBe('04/10');
  });

  it('writes numbers the way each language does', () => {
    expect(en.percent(47.027772)).toBe('47.03%');
    expect(en.votes(56104503)).toBe('56,104,503');
    expect(en.points(2.5)).toBe('2.50 pts');
    expect(en.compactVotes(1_234_567)).toBe('1.2M');
    expect(de.votes(56104503)).toBe('56.104.503');
    expect(de.pointsChange(2.5)).toBe('+2,50 Pp.');
    expect(ja.compactVotes(45_600)).toBe('5万');
  });

  it('tells Brasília time in every language', () => {
    expect(pt.time('2026-10-25T22:42:00Z')).toBe('19:42');
    expect(de.time('2026-10-25T22:42:00Z')).toBe('19:42');
    expect(en.time('2026-10-25T22:42:00Z')).toBe('07:42 PM');
    expect(en.date('2026-10-05T02:00:00Z')).toBe('10/04');
    expect(pt.dayMonth('2026-10-25T12:00:00-03:00')).toBe('25 de outubro');
    expect(en.dayMonth('2026-10-04T12:00:00-03:00')).toBe('October 4');
  });
});
