import { describe, expect, it } from 'vitest';
import {
  formatCompactVotes,
  formatDate,
  formatLead,
  formatName,
  formatPercent,
  formatPoints,
  formatPointsChange,
  formatTime,
  formatVotes,
  initialsOf,
} from './format';

describe('format', () => {
  it('formats percentages in pt-BR', () => {
    expect(formatPercent(47.027772)).toBe('47,03%');
  });

  it('formats vote counts with thousands separators', () => {
    expect(formatVotes(56104503)).toBe('56.104.503');
  });

  it('formats percentage points', () => {
    expect(formatPoints(2.5)).toBe('2,50 p.p.');
  });

  it('formats compact leads with one decimal', () => {
    expect(formatLead(2.345)).toBe('+2,3');
    expect(formatLead(2.345, 2)).toBe('+2,35');
  });

  it('formats dates in Brasília', () => {
    expect(formatDate('2026-10-05T02:00:00Z')).toBe('04/10');
  });

  it('formats times in Brasília', () => {
    expect(formatTime('2026-10-25T22:42:00Z')).toBe('19:42');
  });

  it('title-cases TSE uppercase names', () => {
    expect(formatName('RUI COSTA DA SILVA')).toBe('Rui Costa da Silva');
  });

  it('restores accents the TSE drops from ballot names', () => {
    expect(formatName('FLAVIO BOLSONARO')).toBe('Flávio Bolsonaro');
  });

  it('builds avatar initials', () => {
    expect(initialsOf('Flávio Bolsonaro')).toBe('FB');
    expect(initialsOf('Lula')).toBe('L');
    expect(initialsOf('Rui Costa da Silva')).toBe('RC');
  });
});

describe('formatCompactVotes', () => {
  it('abbreviates millions and thousands', () => {
    expect(formatCompactVotes(1_234_567)).toBe('1,2 mi');
    expect(formatCompactVotes(45_600)).toBe('46 mil');
    expect(formatCompactVotes(9_870)).toBe('9.870');
    expect(formatCompactVotes(999_600)).toBe('1,0 mi');
  });

  it('keeps the sign', () => {
    expect(formatCompactVotes(-2_500_000)).toBe('-2,5 mi');
  });
});

describe('formatPointsChange', () => {
  it('signs gains and losses', () => {
    expect(formatPointsChange(2.5)).toBe('+2,50 p.p.');
    expect(formatPointsChange(-1)).toBe('−1,00 p.p.');
    expect(formatPointsChange(0)).toBe('0,00 p.p.');
  });
});
