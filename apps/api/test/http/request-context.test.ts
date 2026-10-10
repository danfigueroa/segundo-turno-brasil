import { describe, expect, it } from 'vitest';
import { currentOidcToken, runWithRequestContext } from '../../src/http/request-context';

describe('request context', () => {
  it('exposes the OIDC token to everything awaited inside the request', async () => {
    const token = await runWithRequestContext({ oidcToken: 'oidc-1' }, async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      return currentOidcToken();
    });
    expect(token).toBe('oidc-1');
  });

  it('has no token outside a request', () => {
    expect(currentOidcToken()).toBeUndefined();
  });
});
