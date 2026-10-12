import { createHash } from 'node:crypto';

/**
 * Weak ETag of a response body, ignoring `fetchedAt`: a refresh that brought the same
 * data keeps the same tag, so polling clients get a body-less 304 instead of the JSON.
 */
export function etagOf(body: object): string {
  const data = JSON.stringify(body, (key, value: unknown) =>
    key === 'fetchedAt' ? undefined : value,
  );
  const hash = createHash('sha1').update(data).digest('base64url');
  return `W/"${hash.slice(0, 16)}"`;
}

/** True when `If-None-Match` lists `etag` (or `*`), comparing weakly as RFC 9110 says. */
function matches(request: Request, etag: string): boolean {
  const header = request.headers.get('if-none-match');
  if (!header) return false;
  const opaque = (tag: string) => tag.trim().replace(/^W\//, '');
  return header.split(',').some((tag) => tag.trim() === '*' || opaque(tag) === opaque(etag));
}

/**
 * JSON response with an ETag, or a 304 with the same headers when the client already has
 * that version. The CDN keeps the ETag, so it can answer revalidations by itself.
 */
export function jsonResponse(
  request: Request,
  body: object,
  headers: Record<string, string>,
): Response {
  const etag = etagOf(body);
  const all = { ...headers, etag };
  if (matches(request, etag)) return new Response(null, { status: 304, headers: all });
  return Response.json(body, { headers: all });
}
