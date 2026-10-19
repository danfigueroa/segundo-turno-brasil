import { describe, expect, it } from 'vitest';
import { DEFAULT_I18N as pt } from '../i18n/i18n';
import { loadI18n } from '../i18n/load';
import { embedCode, fullSiteUrl, isEmbed } from './embed';
import { SITE_URL } from './site';

describe('embed', () => {
  it('is on with the embed query parameter', () => {
    expect(isEmbed('?embed')).toBe(true);
    expect(isEmbed('?embed=1')).toBe(true);
    expect(isEmbed('')).toBe(false);
  });

  it('links back to the production site at the same scope', () => {
    expect(fullSiteUrl('pt-BR', '#/2turno/ba')).toBe(`${SITE_URL}/#/2turno/ba`);
    expect(fullSiteUrl('pt-BR', '')).toBe(`${SITE_URL}/`);
  });

  it('keeps the language of the link', () => {
    expect(fullSiteUrl('ja', '#/ba')).toBe(`${SITE_URL}/?lang=ja#/ba`);
  });

  it('writes the iframe of a scope', () => {
    expect(embedCode('https://example.com', { kind: 'state', code: 'BA' }, pt)).toBe(
      '<iframe src="https://example.com/?embed#/ba" title="Apuração ao vivo · Segundo Turno" width="100%" height="620" style="border:0;max-width:640px" loading="lazy"></iframe>',
    );
  });

  it('embeds in the language on screen', async () => {
    const en = await loadI18n('en');
    expect(embedCode('https://example.com', { kind: 'abroad' }, en)).toContain(
      'src="https://example.com/?embed&lang=en#/exterior" title="Live vote count · Segundo Turno"',
    );
  });
});
