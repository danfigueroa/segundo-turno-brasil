import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config';

describe('loadConfig', () => {
  it('defaults to the live TSE source of the 2026 runoff', () => {
    expect(loadConfig({})).toMatchObject({
      DATA_SOURCE: 'tse',
      TSE_BASE_URL: 'https://resultados.tse.jus.br/oficial/ele2026',
      TSE_ELECTION_CODE: '6258',
      TSE_TIMEOUT_MS: 8000,
    });
  });

  it('coerces numeric variables', () => {
    expect(loadConfig({ TSE_TIMEOUT_MS: '3000' }).TSE_TIMEOUT_MS).toBe(3000);
  });

  it('rejects unknown data sources', () => {
    expect(() => loadConfig({ DATA_SOURCE: 'mock' })).toThrow();
  });
});
