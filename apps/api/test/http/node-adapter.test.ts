import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { toNodeListener } from '../../src/http/node-adapter';

let server: Server | undefined;

afterEach(() => server?.close());

async function serve(listener: ReturnType<typeof toNodeListener>): Promise<string> {
  server = createServer((req, res) => void listener(req, res));
  await new Promise<void>((resolve) => server?.listen(0, resolve));
  return `http://localhost:${(server?.address() as AddressInfo).port}`;
}

describe('toNodeListener', () => {
  it('forwards the request and writes status, headers and body', async () => {
    const base = await serve(
      toNodeListener(async (request) =>
        Response.json(
          { path: new URL(request.url).pathname, accept: request.headers.get('accept') },
          { status: 201, headers: { 'x-test': 'yes' } },
        ),
      ),
    );

    const response = await fetch(`${base}/api/results?x=1`, { headers: { accept: 'text/plain' } });
    expect(response.status).toBe(201);
    expect(response.headers.get('x-test')).toBe('yes');
    expect(await response.json()).toEqual({ path: '/api/results', accept: 'text/plain' });
  });
});
