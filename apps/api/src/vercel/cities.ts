/** Vercel function entry for `GET /api/cities` (bundled by `scripts/build-vercel-output.mjs`). */
import { toNodeListener } from '../http/node-adapter';
import { routes } from '../main';

export default toNodeListener(routes['/api/cities']);
