import { loadConfig } from './config';
import { createRoutes } from './container';

export const routes = createRoutes(loadConfig(process.env));
