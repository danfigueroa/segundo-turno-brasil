import { describe, expect, it } from 'vitest';
import { DEFAULT_I18N } from './i18n';
import { loadI18n } from './load';

describe('country names', () => {
  it('keeps the TSE names in Portuguese', () => {
    expect(DEFAULT_I18N.country('Holanda')).toBe('Holanda');
  });

  it('names countries in the language on screen', async () => {
    expect((await loadI18n('fr')).country('Estados Unidos')).toBe('États-Unis');
    expect((await loadI18n('ja')).country('Japão')).toBe('日本');
  });

  it('falls back to the TSE name of a country it does not know', async () => {
    expect((await loadI18n('en')).country('Atlântida')).toBe('Atlântida');
  });
});
