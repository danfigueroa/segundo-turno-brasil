import { createServer } from 'node:http';
import { toNodeListener } from './http/node-adapter';
import { routes } from './main';

const port = Number(process.env.PORT ?? 3001);
const listeners = new Map(
  Object.entries(routes).map(([path, handler]) => [path, toNodeListener(handler)]),
);

createServer((req, res) => {
  const path = new URL(req.url ?? '/', 'http://localhost').pathname;
  const listener = listeners.get(path);
  if (!listener) {
    res.writeHead(404, { 'content-type': 'application/json' }).end('{"error":"Not found"}');
    return;
  }
  listener(req, res).catch((error: unknown) => {
    console.error(error);
    res.writeHead(500).end();
  });
}).listen(port, () => {
  console.log(`API on http://localhost:${port} (DATA_SOURCE=${process.env.DATA_SOURCE ?? 'tse'})`);
});
