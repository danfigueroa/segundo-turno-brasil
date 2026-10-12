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

/** The Latin subset of the variable font, the only one pt-BR text needs. */
const LATIN_FONT = /schibsted-grotesk-latin-wght-normal-[\w-]+\.woff2$/;

/**
 * Preloads the Latin font, which the browser would only discover after the CSS: text
 * renders in the right font from the first paint, without a swap.
 */
function preloadFont(): Plugin {
  return {
    name: 'preload-font',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler: (_html, { bundle }) => {
        const font = Object.keys(bundle ?? {}).find((file) => LATIN_FONT.test(file));
        if (!font) throw new Error('Latin font not found in the bundle');
        return [
          {
            tag: 'link',
            attrs: {
              rel: 'preload',
              href: `/${font}`,
              as: 'font',
              type: 'font/woff2',
              crossorigin: '',
            },
            injectTo: 'head',
          },
        ];
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), siteUrl(), preloadFont()],
  server: {
    proxy: { '/api': 'http://localhost:3001' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
  },
});
