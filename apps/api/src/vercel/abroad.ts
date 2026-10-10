/** Vercel function entry for `GET /api/abroad` (bundled by `scripts/build-vercel-output.mjs`). */
import { toNodeListener } from '../http/node-adapter';
import { routes } from '../main';

export default toNodeListener(routes['/api/abroad']);
