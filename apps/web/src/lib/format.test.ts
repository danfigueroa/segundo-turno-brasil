import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatLead,
  formatName,
  formatPercent,
  formatPoints,
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
