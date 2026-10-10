import { STATE_CODES } from '@stb/domain';
import { formatPercent, formatVotes } from '../../lib/format';
import { BRAZIL_MAP } from '../map/brazil-map';
import { SHARE_PALETTE as P } from './palette';
import type { DetailMap, ShareContent } from './share-content';

export type ShareFormat = 'story' | 'feed';

interface Layout {
  readonly width: number;
  readonly height: number;
  /** Bottom of the green header band. */
  readonly band: number;
  /** The flag rhombus in the band's corner: center height and half-diagonal. */
  readonly rhombus: { readonly y: number; readonly radius: number };
  readonly brand: number;
  readonly kicker: number;
  readonly title: number;
  /** Top of the white result card. */
  readonly card: number;
  readonly map: { readonly top: number; readonly size: number };
  readonly progress: number;
  readonly url: number;
}

/**
 * Stories: 1080×1920 (9:16). Nothing essential in the top/bottom ~250px, which the
 * Instagram UI covers: there only the green band and the flag stripe. Feed: 1080×1350 (4:5).
 */
export const LAYOUTS: Readonly<Record<ShareFormat, Layout>> = {
  story: {
    width: 1080,
    height: 1920,
    band: 760,
    rhombus: { y: 330, radius: 321 },
    brand: 300,
    kicker: 450,
    title: 590,
    card: 652,
    map: { top: 1120, size: 400 },
    progress: 1556,
    url: 1662,
  },
  feed: {
    width: 1080,
    height: 1350,
    band: 520,
    rhombus: { y: 110, radius: 230 },
    brand: 70,
    kicker: 220,
    title: 350,
    card: 410,
    map: { top: 880, size: 300 },
    progress: 1214,
    url: 1312,
  },
};

const MARGIN = 66;
const CARD = { x: 42, padding: 48, height: 436, radius: 54 } as const;
const FAMILY = '"Schibsted Grotesk Variable", "Helvetica Neue", Helvetica, sans-serif';

/** The canvas only uses web fonts that are already loaded: load them before drawing. */
export async function loadShareFonts(): Promise<void> {
  await Promise.all(
    [600, 700, 800, 900].map((weight) =>
      document.fonts?.load(`${weight} 40px "Schibsted Grotesk Variable"`),
    ),
  );
}

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

  drawBand(ctx, content, layout);
  drawResultCard(ctx, content, layout);
  drawMap(ctx, content, layout);
  drawLeadCounts(ctx, content, layout);
  drawFooter(ctx, content, layout);
  drawFlagStripe(ctx, layout.height - 18, layout.width, 18);
  return canvas;
}

function font(weight: number, size: number) {
  return `${weight} ${size}px ${FAMILY}`;
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

function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const unit = size / 34;
  ctx.fillStyle = P.onBrand;
  roundRect(ctx, x, y, size, size, 9 * unit);
  ctx.fillStyle = P.yellow;
  ctx.beginPath();
  ctx.moveTo(x + 17 * unit, y + 5 * unit);
  ctx.lineTo(x + 30 * unit, y + 17 * unit);
  ctx.lineTo(x + 17 * unit, y + 29 * unit);
  ctx.lineTo(x + 4 * unit, y + 17 * unit);
  ctx.fill();
  ctx.fillStyle = P.brand;
  ctx.beginPath();
  ctx.arc(x + 17 * unit, y + 17 * unit, 6 * unit, 0, Math.PI * 2);
  ctx.fill();
}

function drawBand(ctx: CanvasRenderingContext2D, content: ShareContent, layout: Layout) {
  ctx.fillStyle = P.brand;
  ctx.fillRect(0, 0, layout.width, layout.band);

  // The flag's rhombus and globe, cropped by the right edge.
  const { y, radius } = layout.rhombus;
  const cx = layout.width - radius * 0.35;
  ctx.fillStyle = P.yellow;
  ctx.beginPath();
  ctx.moveTo(cx, y - radius);
  ctx.lineTo(cx + radius, y);
  ctx.lineTo(cx, y + radius);
  ctx.lineTo(cx - radius, y);
  ctx.fill();
  ctx.fillStyle = P.onBrand;
  ctx.beginPath();
  ctx.arc(cx, y, radius * 0.43, 0, Math.PI * 2);
  ctx.fill();

  drawLogo(ctx, MARGIN, layout.brand, 66);
  ctx.textAlign = 'left';
  ctx.fillStyle = P.onBrand;
  ctx.font = font(800, 39);
  ctx.fillText('Segundo Turno', MARGIN + 90, layout.brand + 47);

  ctx.font = font(700, 33);
  ctx.letterSpacing = '4px';
  ctx.fillText(content.kicker, MARGIN, layout.kicker);
  ctx.letterSpacing = '0px';

  // Kept clear of the rhombus tip on the right.
  fitText(ctx, content.title, 900, 138, layout.width - MARGIN * 2 - 60);
  ctx.fillText(content.title, MARGIN, layout.title);
}

function drawResultCard(ctx: CanvasRenderingContext2D, content: ShareContent, layout: Layout) {
  const width = layout.width - CARD.x * 2;
  const top = layout.card;
  ctx.save();
  ctx.shadowColor = 'rgba(15, 26, 20, 0.12)';
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = P.card;
  roundRect(ctx, CARD.x, top, width, CARD.height, CARD.radius);
  ctx.restore();

  const left = CARD.x + CARD.padding;
  const right = CARD.x + width - CARD.padding;
  const columnWidth = (right - left) / 2 - 15;

  content.results.forEach((r, index) => {
    const isRight = index === 1;
    const x = isRight ? right : left;
    ctx.textAlign = isRight ? 'right' : 'left';

    ctx.fillStyle = P.candidates[r.hue];
    roundRect(ctx, isRight ? x - 30 : x, top + 61, 30, 30, 9);
    ctx.fillStyle = P.text;
    fitText(ctx, r.name, 700, 39, columnWidth - 48);
    ctx.fillText(r.name, isRight ? x - 48 : x + 48, top + 87);

    fitText(ctx, formatPercent(r.share), 800, 102, columnWidth);
    ctx.fillText(formatPercent(r.share), x, top + 209);

    ctx.fillStyle = P.secondary;
    fitText(ctx, `${r.party} · ${formatVotes(r.votes)} votos`, 500, 30, columnWidth);
    ctx.fillText(`${r.party} · ${formatVotes(r.votes)} votos`, x, top + 254);
  });

  drawSplitBar(ctx, content, left, top + 294, right - left);

  ctx.fillStyle = P.secondary;
  ctx.font = font(600, 33);
  const [margin, others] = content.notes;
  ctx.textAlign = 'left';
  ctx.fillText(margin, left, top + 388);
  ctx.textAlign = 'right';
  ctx.fillText(others, right, top + 388);
}

/** Finalists at the ends, the other candidates in gray between them, 50% marked. */
function drawSplitBar(
  ctx: CanvasRenderingContext2D,
  content: ShareContent,
  x: number,
  y: number,
  width: number,
) {
  const [first, second] = content.results;
  const height = 36;
  ctx.fillStyle = P.track;
  roundRect(ctx, x, y, width, height, height / 2);

  const total = (first?.votes ?? 0) + content.othersVotes + (second?.votes ?? 0);
  if (first && second && total > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, height / 2);
    ctx.clip();
    const firstWidth = (first.votes / total) * width;
    const secondWidth = (second.votes / total) * width;
    ctx.fillStyle = P.candidates[first.hue];
    ctx.fillRect(x, y, firstWidth, height);
    ctx.fillStyle = P.others;
    ctx.fillRect(x + firstWidth, y, width - firstWidth - secondWidth, height);
    ctx.fillStyle = P.candidates[second.hue];
    ctx.fillRect(x + width - secondWidth, y, secondWidth, height);
    ctx.restore();
  }

  ctx.fillStyle = P.text;
  ctx.fillRect(x + width / 2 - 3, y - 12, 6, height + 24);
}

/** Fits a viewBox into the map square and returns the scale applied. */
function placeMap(ctx: CanvasRenderingContext2D, viewBox: string, layout: Layout): number {
  const [minX = 0, minY = 0, vbWidth = 1000, vbHeight = 1000] = viewBox.split(' ').map(Number);
  const { top, size } = layout.map;
  const scale = Math.min(size / vbWidth, size / vbHeight);
  ctx.translate(MARGIN, top);
  ctx.scale(scale, scale);
  ctx.translate(-minX, -minY);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = P.mapStroke;
  return scale;
}

/** A city: its state's municipalities, the city outlined. */
function drawDetailMap(ctx: CanvasRenderingContext2D, map: DetailMap, layout: Layout) {
  ctx.save();
  const scale = placeMap(ctx, map.viewBox, layout);
  ctx.lineWidth = 1 / scale;
  for (const shape of map.shapes) {
    const path = new Path2D(shape.d);
    ctx.fillStyle = shape.fill;
    ctx.fill(path);
    ctx.stroke(path);
  }
  if (map.selected) {
    ctx.lineWidth = 6 / scale;
    ctx.strokeStyle = P.text;
    ctx.stroke(new Path2D(map.selected));
  }
  ctx.restore();
}

function drawMap(ctx: CanvasRenderingContext2D, content: ShareContent, layout: Layout) {
  if (content.detailMap) {
    drawDetailMap(ctx, content.detailMap, layout);
    return;
  }
  ctx.save();
  const scale = placeMap(ctx, BRAZIL_MAP.viewBox, layout);
  ctx.lineWidth = 2 / scale;

  for (const code of STATE_CODES) {
    const path = new Path2D(BRAZIL_MAP.states[code].d);
    ctx.globalAlpha = content.focus.has(code) ? 1 : 0.25;
    ctx.fillStyle = content.mapFills[code];
    ctx.fill(path);
    ctx.stroke(path);
  }

  if (content.focus.size === 1) {
    const [code] = content.focus;
    if (code) {
      ctx.globalAlpha = 1;
      ctx.lineWidth = 6 / scale;
      ctx.strokeStyle = P.text;
      ctx.stroke(new Path2D(BRAZIL_MAP.states[code].d));
    }
  }
  ctx.restore();
}

function drawLeadCounts(ctx: CanvasRenderingContext2D, content: ShareContent, layout: Layout) {
  const { top, size } = layout.map;
  const x = MARGIN + size + 54;
  const maxWidth = layout.width - MARGIN - x;
  const rowHeight = 132;
  const firstRow = top + size / 2 - rowHeight + 40;
  ctx.textAlign = 'left';
  content.leadCounts.forEach((count, index) => {
    const y = firstRow + index * rowHeight;
    ctx.fillStyle = P.secondary;
    ctx.font = font(600, 33);
    ctx.fillText(count.label, x, y);
    ctx.fillStyle = P.candidateText[count.hue];
    fitText(ctx, count.value, 800, 60, maxWidth);
    ctx.fillText(count.value, x, y + 66);
  });
}

function drawFooter(ctx: CanvasRenderingContext2D, content: ShareContent, layout: Layout) {
  const width = layout.width - MARGIN * 2;
  ctx.fillStyle = P.track;
  roundRect(ctx, MARGIN, layout.progress, width, 12, 6);
  ctx.fillStyle = P.brand;
  roundRect(ctx, MARGIN, layout.progress, (width * content.counted) / 100, 12, 6);

  ctx.fillStyle = P.secondary;
  ctx.font = font(600, 30);
  ctx.textAlign = 'left';
  ctx.fillText(
    `${formatPercent(content.counted)} das seções apuradas`,
    MARGIN,
    layout.progress + 54,
  );
  ctx.textAlign = 'right';
  ctx.fillText(content.source, layout.width - MARGIN, layout.progress + 54);

  ctx.textAlign = 'left';
  ctx.fillStyle = P.text;
  ctx.font = font(800, 39);
  ctx.fillText(content.siteUrl, MARGIN, layout.url);
}

/** Green and yellow, 3:1, as at the top of the site. */
function drawFlagStripe(ctx: CanvasRenderingContext2D, y: number, width: number, height: number) {
  ctx.fillStyle = P.brand;
  ctx.fillRect(0, y, width * 0.75, height);
  ctx.fillStyle = P.yellow;
  ctx.fillRect(width * 0.75, y, width * 0.25, height);
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
