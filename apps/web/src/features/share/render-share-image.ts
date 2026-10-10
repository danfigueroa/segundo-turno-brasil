import { STATE_CODES } from '@stb/domain';
import { formatPercent, formatTime, formatVotes } from '../../lib/format';
import { ABROAD_TILE, BRAZIL_MAP } from '../map/brazil-map';
import { SHARE_PALETTE as P } from './palette';
import type { ShareContent } from './share-content';

export type ShareFormat = 'story' | 'feed';

interface Layout {
  readonly width: number;
  readonly height: number;
  readonly kicker: number;
  readonly title: number;
  readonly names: number;
  readonly shares: number;
  readonly votes: number;
  readonly split: number;
  readonly map: { readonly top: number; readonly height: number };
  readonly progressText: number;
  readonly progressBar: number;
  readonly updated: number;
  readonly url: number;
}

/**
 * Stories: 1080×1920 (9:16). Nothing essential in the top/bottom ~250px, which the
 * Instagram UI covers. Feed: 1080×1350 (4:5).
 */
export const LAYOUTS: Readonly<Record<ShareFormat, Layout>> = {
  story: {
    width: 1080,
    height: 1920,
    kicker: 300,
    title: 380,
    names: 480,
    shares: 610,
    votes: 670,
    split: 720,
    map: { top: 790, height: 660 },
    progressText: 1500,
    progressBar: 1530,
    updated: 1600,
    url: 1650,
  },
  feed: {
    width: 1080,
    height: 1350,
    kicker: 100,
    title: 175,
    names: 260,
    shares: 380,
    votes: 435,
    split: 480,
    map: { top: 540, height: 540 },
    progressText: 1135,
    progressBar: 1162,
    updated: 1235,
    url: 1285,
  },
};

const MARGIN = 80;
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/** Draws the share image for the given content into a new canvas. */
export function renderShareImage(content: ShareContent, format: ShareFormat): HTMLCanvasElement {
  const layout = LAYOUTS[format];
  const canvas = document.createElement('canvas');
  canvas.width = layout.width;
  canvas.height = layout.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not supported');

  ctx.fillStyle = P.background;
  ctx.fillRect(0, 0, layout.width, layout.height);

  drawHeader(ctx, content, layout);
  drawCandidates(ctx, content, layout);
  drawSplitBar(ctx, content, layout);
  drawMap(ctx, content, layout);
  drawProgress(ctx, content, layout);
  drawFooter(ctx, content, layout);
  return canvas;
}

function font(weight: number, size: number) {
  return `${weight} ${size}px ${FONT}`;
}

/** Shrinks the font until the text fits the width. */
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  weight: number,
  size: number,
  maxWidth: number,
) {
  let current = size;
  ctx.font = font(weight, current);
  while (ctx.measureText(text).width > maxWidth && current > 12) {
    current -= 2;
    ctx.font = font(weight, current);
  }
}

function drawHeader(ctx: CanvasRenderingContext2D, content: ShareContent, layout: Layout) {
  ctx.textAlign = 'left';
  ctx.fillStyle = P.muted;
  ctx.font = font(700, 32);
  ctx.letterSpacing = '4px';
  const kicker =
    content.round === 1 ? '1º TURNO 2026 · RESULTADO FINAL' : '2º TURNO 2026 · PRESIDENTE';
  ctx.fillText(kicker, MARGIN, layout.kicker);
  ctx.letterSpacing = '0px';

  ctx.fillStyle = P.text;
  fitText(ctx, content.title, 800, 76, layout.width - MARGIN * 2);
  ctx.fillText(content.title, MARGIN, layout.title);
}

function drawCandidates(ctx: CanvasRenderingContext2D, content: ShareContent, layout: Layout) {
  const columnWidth = (layout.width - MARGIN * 2) / 2 - 20;
  content.results.forEach((r, index) => {
    const right = index === 1;
    const x = right ? layout.width - MARGIN : MARGIN;
    ctx.textAlign = right ? 'right' : 'left';

    ctx.fillStyle = P.text;
    fitText(ctx, r.name, 650, 44, columnWidth - 40);
    ctx.fillText(r.name, right ? x - 40 : x + 40, layout.names);
    ctx.fillStyle = P.candidates[r.hue];
    roundRect(ctx, right ? x - 24 : x, layout.names - 30, 24, 24, 6);

    // The leader's number stands out; the runner-up's recedes to secondary ink.
    ctx.fillStyle = content.leaderNumber === r.number ? P.text : P.secondary;
    fitText(ctx, formatPercent(r.share), 800, 128, columnWidth);
    ctx.fillText(formatPercent(r.share), x, layout.shares);

    ctx.fillStyle = P.secondary;
    ctx.font = font(500, 34);
    ctx.fillText(`${r.party} · ${formatVotes(r.votes)} votos`, x, layout.votes);
  });
}

function drawSplitBar(ctx: CanvasRenderingContext2D, content: ShareContent, layout: Layout) {
  const width = layout.width - MARGIN * 2;
  const total = content.results.reduce((sum, r) => sum + r.votes, 0);
  const [left, right] = content.results;
  if (!left || !right) return;
  const leftWidth = total === 0 ? width / 2 : (left.votes / total) * width;
  const gap = 4;

  ctx.fillStyle = P.candidates[left.hue];
  roundRect(ctx, MARGIN, layout.split, Math.max(leftWidth - gap / 2, 0), 28, 8);
  ctx.fillStyle = P.candidates[right.hue];
  roundRect(
    ctx,
    MARGIN + leftWidth + gap / 2,
    layout.split,
    Math.max(width - leftWidth - gap / 2, 0),
    28,
    8,
  );
  ctx.fillStyle = P.text;
  ctx.fillRect(layout.width / 2 - 2, layout.split - 8, 4, 44);
}

function drawMap(ctx: CanvasRenderingContext2D, content: ShareContent, layout: Layout) {
  const [minX = 0, minY = 0, vbWidth = 1000, vbHeight = 1000] = BRAZIL_MAP.viewBox
    .split(' ')
    .map(Number);
  const scale = Math.min((layout.width - MARGIN * 2) / vbWidth, layout.map.height / vbHeight);
  const offsetX = (layout.width - vbWidth * scale) / 2;

  ctx.save();
  ctx.translate(offsetX, layout.map.top);
  ctx.scale(scale, scale);
  ctx.translate(-minX, -minY);
  ctx.lineWidth = 2 / scale;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = P.background;

  for (const code of STATE_CODES) {
    const path = new Path2D(BRAZIL_MAP.states[code].d);
    ctx.globalAlpha = content.focus.has(code) ? 1 : 0.5;
    ctx.fillStyle = content.focus.has(code) ? content.mapFills[code] : P.mapEmpty;
    ctx.fill(path);
    ctx.stroke(path);
  }

  drawAbroadTile(ctx, content, scale);

  if (content.focus.size === 1) {
    const [code] = content.focus;
    if (code) {
      ctx.globalAlpha = 1;
      ctx.lineWidth = 5 / scale;
      ctx.strokeStyle = P.text;
      ctx.stroke(new Path2D(BRAZIL_MAP.states[code].d));
    }
  }
  ctx.restore();
}

function drawAbroadTile(ctx: CanvasRenderingContext2D, content: ShareContent, scale: number) {
  const { x, y, width, height, radius } = ABROAD_TILE;
  const highlighted = content.abroadInFocus && content.focus.size === 0;
  ctx.globalAlpha = content.abroadInFocus ? 1 : 0.5;
  ctx.fillStyle = content.abroadInFocus ? content.abroadFill : P.mapEmpty;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
  if (highlighted) {
    ctx.lineWidth = 5 / scale;
    ctx.strokeStyle = P.text;
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.fillStyle = P.text;
  ctx.font = font(700, 36);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Exterior', x + width / 2, y + height / 2);
  ctx.textBaseline = 'alphabetic';
}

function drawProgress(ctx: CanvasRenderingContext2D, content: ShareContent, layout: Layout) {
  const width = layout.width - MARGIN * 2;
  ctx.textAlign = 'left';
  ctx.fillStyle = P.secondary;
  ctx.font = font(500, 36);
  ctx.fillText(
    `${formatPercent(content.counted)} das seções apuradas`,
    MARGIN,
    layout.progressText,
  );

  ctx.fillStyle = P.track;
  roundRect(ctx, MARGIN, layout.progressBar, width, 12, 6);
  ctx.fillStyle = P.text;
  roundRect(ctx, MARGIN, layout.progressBar, (width * content.counted) / 100, 12, 6);
}

function drawFooter(ctx: CanvasRenderingContext2D, content: ShareContent, layout: Layout) {
  ctx.textAlign = 'left';
  ctx.fillStyle = P.muted;
  ctx.font = font(500, 30);
  ctx.fillText(
    `Atualizado às ${formatTime(content.updatedAt)} (Brasília) · Fonte: TSE`,
    MARGIN,
    layout.updated,
  );
  ctx.fillStyle = P.text;
  ctx.font = font(700, 36);
  ctx.fillText(content.siteUrl, MARGIN, layout.url);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  if (width <= 0) return;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, Math.min(radius, width / 2));
  ctx.fill();
}
