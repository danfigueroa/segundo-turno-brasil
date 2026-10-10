/**
 * Renders the link preview image (Open Graph, 1200×630) into `public/og.png`: the brand,
 * what the site is and the map of Brazil, with the site's own font. Drawn as HTML and
 * captured with a headless Chromium, as no image library in the build knows the font.
 *
 *   pnpm --filter @stb/web og:build
 *
 * Needs a Chromium for `playwright-core`: `npx playwright install chromium-headless-shell`,
 * or a browser binary in `CHROME_PATH`.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { STATE_CODES, STATES, type RegionCode } from '@stb/domain';
import { chromium } from 'playwright-core';
import brazilMap from '../src/features/map/brazil-map.generated.json';

const WIDTH = 1200;
const HEIGHT = 630;
/** Brand greens, one per region: a picture of Brazil, not of any result. */
const REGION_FILLS: Record<RegionCode, string> = {
  N: '#cfe8d8',
  NE: '#7fc29b',
  CO: '#a6d6b8',
  SE: '#00843d',
  S: '#3fa56b',
};

const require = createRequire(import.meta.url);
const font = readFileSync(
  require.resolve('@fontsource-variable/schibsted-grotesk/files/schibsted-grotesk-latin-wght-normal.woff2'),
).toString('base64');

const states = STATE_CODES.map(
  (code) => `<path d="${brazilMap.states[code].d}" fill="${REGION_FILLS[STATES[code].region]}" />`,
).join('');
const scopes = ['Brasil', 'Regiões', 'Estados', 'Cidades', 'Exterior']
  .map((scope) => `<span class="chip">${scope}</span>`)
  .join('');

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<style>
  @font-face {
    font-family: 'Schibsted Grotesk';
    src: url(data:font/woff2;base64,${font}) format('woff2');
    font-weight: 400 900;
  }
  * { box-sizing: border-box; margin: 0; }
  body {
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    overflow: hidden;
    background: #f5f6f1;
    color: #0f1a14;
    font-family: 'Schibsted Grotesk', sans-serif;
  }
  .stripe { position: absolute; inset: 0 0 auto; height: 12px; display: flex; }
  .stripe span:first-child { flex: 3; background: #00843d; }
  .stripe span:last-child { flex: 1; background: #ffd60a; }
  .text { position: absolute; left: 72px; top: 76px; width: 600px; }
  .brand { display: flex; align-items: center; gap: 22px; }
  .brand svg { width: 80px; height: 80px; }
  .live {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 8px 18px; border-radius: 999px;
    background: #e3f1e8; color: #00632e;
    font-size: 24px; font-weight: 800;
  }
  .live::before { content: ''; width: 12px; height: 12px; border-radius: 50%; background: #00843d; }
  h1 { margin-top: 30px; font-size: 84px; font-weight: 900; letter-spacing: -0.035em; line-height: 0.95; }
  p { margin-top: 20px; font-size: 30px; font-weight: 600; line-height: 1.25; color: #3c4740; }
  .chips { margin-top: 30px; display: flex; flex-wrap: wrap; gap: 10px; }
  .chip {
    padding: 8px 16px; border-radius: 999px;
    border: 2px solid #d6dbd2; background: #fff;
    font-size: 22px; font-weight: 700;
  }
  .map { position: absolute; right: 48px; top: 70px; width: 470px; height: 500px; }
  .map path { stroke: #ffffff; stroke-width: 3; stroke-linejoin: round; }
</style>
</head>
<body>
  <div class="stripe"><span></span><span></span></div>
  <div class="text">
    <div class="brand">
      <svg viewBox="0 0 34 34"><rect width="34" height="34" rx="9" fill="#00843d"/><polygon points="17,5 30,17 17,29 4,17" fill="#ffd60a"/><circle cx="17" cy="17" r="6" fill="#fff"/></svg>
      <span class="live">Apuração ao vivo</span>
    </div>
    <h1>Segundo Turno 2026</h1>
    <p>O resultado da eleição presidencial no mapa, com os dados do TSE.</p>
    <div class="chips">${scopes}</div>
  </div>
  <svg class="map" viewBox="${brazilMap.viewBox}">${states}</svg>
</body>
</html>`;

const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
);
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: new URL('../public/og.png', import.meta.url).pathname });
await browser.close();
console.log('Link preview image written to public/og.png');
