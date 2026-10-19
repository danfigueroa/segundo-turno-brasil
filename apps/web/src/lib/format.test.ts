import { describe, expect, it } from 'vitest';
import { formatName, initialsOf } from './format';

describe('format', () => {
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
