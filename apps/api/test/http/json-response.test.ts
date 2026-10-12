import { describe, expect, it } from 'vitest';
import { etagOf, jsonResponse } from '../../src/http/json-response';

const body = { round: 2, value: 42, fetchedAt: '2026-10-25T21:00:00.000Z' };
const request = (ifNoneMatch?: string) =>
  new Request('http://localhost/api/results', {
    headers: ifNoneMatch ? { 'if-none-match': ifNoneMatch } : {},
  });

describe('etagOf', () => {
  it('ignores when the data was fetched', () => {
    expect(etagOf({ ...body, fetchedAt: '2026-10-25T21:00:15.000Z' })).toBe(etagOf(body));
  });

  it('changes with the data', () => {
    expect(etagOf({ ...body, value: 43 })).not.toBe(etagOf(body));
  });

  it('is a weak tag', () => {
    expect(etagOf(body)).toMatch(/^W\/"[\w-]{16}"$/);
  });
});

describe('jsonResponse', () => {
  const headers = { 'cache-control': 'public, s-maxage=15' };

  it('sends the body with its ETag and the given headers', async () => {
    const response = jsonResponse(request(), body, headers);
    expect(response.status).toBe(200);
    expect(response.headers.get('etag')).toBe(etagOf(body));
    expect(response.headers.get('cache-control')).toBe(headers['cache-control']);
    expect(await response.json()).toEqual(body);
  });

  it('answers 304 without a body when the client has that version', async () => {
    const response = jsonResponse(request(etagOf(body)), body, headers);
    expect(response.status).toBe(304);
    expect(response.headers.get('etag')).toBe(etagOf(body));
    expect(response.headers.get('cache-control')).toBe(headers['cache-control']);
    expect(await response.text()).toBe('');
  });

  it('matches strong, listed and wildcard tags', () => {
    const strong = etagOf(body).replace('W/', '');
    expect(jsonResponse(request(strong), body, headers).status).toBe(304);
    expect(jsonResponse(request(`W/"other", ${etagOf(body)}`), body, headers).status).toBe(304);
    expect(jsonResponse(request('*'), body, headers).status).toBe(304);
  });

  it('sends the body when the client has another version', () => {
    expect(jsonResponse(request('W/"other"'), body, headers).status).toBe(200);
  });
});
