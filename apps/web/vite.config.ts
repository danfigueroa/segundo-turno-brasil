import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

/**
 * Link previews need absolute URLs: the production domain from Vercel (a custom domain
 * once there is one), or the default `.vercel.app` one elsewhere.
 */
const SITE_URL = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL ?? 'segundo-turno-brasil.vercel.app'}`;

/** Writes the site URL into `index.html` (`%SITE_URL%`), for the Open Graph tags. */
function siteUrl(): Plugin {
  return {
    name: 'site-url',
    transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', SITE_URL),
  };
}

export default defineConfig({
  plugins: [react(), siteUrl()],
  server: {
    proxy: { '/api': 'http://localhost:3001' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
  },
});
