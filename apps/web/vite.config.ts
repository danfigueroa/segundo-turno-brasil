import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

/**
 * The production address: Vercel's production domain (the custom one), or that domain when
 * building elsewhere. Link previews, shared images and shared links all point here.
 */
const SITE_URL = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL ?? 'eleicao.danielfigueroa.dev'}`;

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
  define: { __SITE_URL__: JSON.stringify(SITE_URL) },
  server: {
    proxy: { '/api': 'http://localhost:3001' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    // Rendering the page with its SVG maps in jsdom is slow, and `pnpm test` runs every
    // package at once: the default 5 s fails on a busy machine, not on a bug.
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});
