import { describe, expect, it } from 'vitest';
import { formatName, formatPercent, formatPoints, formatTime, formatVotes } from './format';

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

  it('formats times in Brasília', () => {
    expect(formatTime('2026-10-25T22:42:00Z')).toBe('19:42');
  });

  it('title-cases TSE uppercase names', () => {
    expect(formatName('FLAVIO BOLSONARO')).toBe('Flavio Bolsonaro');
    expect(formatName('RUI COSTA DA SILVA')).toBe('Rui Costa da Silva');
  });
});
