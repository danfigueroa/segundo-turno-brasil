import { describe, expect, it } from 'vitest';
import { matchLocale, resolveLocale } from './resolve-locale';

describe('matchLocale', () => {
  it('matches a browser tag by its language', () => {
    expect(matchLocale('en-GB')).toBe('en');
    expect(matchLocale('pt-PT')).toBe('pt-BR');
    expect(matchLocale('es-AR')).toBe('es');
    expect(matchLocale('ja')).toBe('ja');
    expect(matchLocale('nl-NL')).toBeUndefined();
  });
});

describe('resolveLocale', () => {
  const none = { search: '', stored: undefined, languages: [] };

  it('defaults to Brazilian Portuguese', () => {
    expect(resolveLocale(none)).toBe('pt-BR');
    expect(resolveLocale({ ...none, languages: ['nl', 'ko'] })).toBe('pt-BR');
  });

  it('follows the browser, skipping languages we do not have', () => {
    expect(resolveLocale({ ...none, languages: ['nl-NL', 'de-AT', 'en'] })).toBe('de');
  });

  it('prefers the language picked before over the browser', () => {
    expect(resolveLocale({ ...none, stored: 'it', languages: ['en-US'] })).toBe('it');
  });

  it('opens a shared link in its language', () => {
    expect(resolveLocale({ search: '?lang=fr', stored: 'it', languages: ['en-US'] })).toBe('fr');
    expect(resolveLocale({ search: '?embed&lang=ja', stored: undefined, languages: [] })).toBe(
      'ja',
    );
  });

  it('ignores an unknown or stale value', () => {
    expect(resolveLocale({ search: '?lang=xx', stored: 'klingon', languages: ['es'] })).toBe('es');
  });
});
