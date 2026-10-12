import { describe, expect, it } from 'vitest';
import { embedCode, fullSiteUrl, isEmbed } from './embed';

describe('embed', () => {
  it('is on with the embed query parameter', () => {
    expect(isEmbed('?embed')).toBe(true);
    expect(isEmbed('?embed=1')).toBe(true);
    expect(isEmbed('')).toBe(false);
  });

  it('links back to the full site at the same scope', () => {
    expect(fullSiteUrl('#/2turno/ba')).toBe('/#/2turno/ba');
    expect(fullSiteUrl('')).toBe('/');
  });

  it('writes the iframe of a scope', () => {
    expect(embedCode('https://example.com', { kind: 'state', code: 'BA' })).toBe(
      '<iframe src="https://example.com/?embed#/ba" title="Apuração ao vivo · Segundo Turno" width="100%" height="620" style="border:0;max-width:640px" loading="lazy"></iframe>',
    );
  });
});
