import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Handler } from './results-handler';

/** Adapts a Fetch API handler to a Node.js request listener (dev server and Vercel). */
export function toNodeListener(handler: Handler) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') headers.set(name, value);
      else value?.forEach((v) => headers.append(name, v));
    }

    const response = await handler(new Request(url, { method: req.method ?? 'GET', headers }));
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(req.method === 'HEAD' ? undefined : Buffer.from(await response.arrayBuffer()));
  };
}
