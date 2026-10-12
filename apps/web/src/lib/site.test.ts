import { describe, expect, it } from 'vitest';
import { SITE_HOST, SITE_URL } from './site';

describe('site', () => {
  it('is the production address, whatever domain the page is on', () => {
    expect(SITE_URL).toBe('https://eleicao.danielfigueroa.dev');
    expect(SITE_HOST).toBe('eleicao.danielfigueroa.dev');
  });
});
