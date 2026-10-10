/** A region of the map, in viewBox units. */
export interface ViewBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

interface Point {
  readonly x: number;
  readonly y: number;
}

/** Room around the cities of a continent, so the edge dots and their names fit. */
const PADDING = 40;
/** Never zoom closer than this width: a continent with a single city stays readable. */
const MIN_WIDTH = 260;
/** Narrowest shape (width ÷ height): a tall continent should not push the page down. */
const MIN_ASPECT = 1;

export function parseViewBox(value: string): ViewBox {
  const [x = 0, y = 0, width = 0, height = 0] = value.split(' ').map(Number);
  return { x, y, width, height };
}

export const formatViewBox = ({ x, y, width, height }: ViewBox): string =>
  [x, y, width, height].map((n) => Math.round(n * 10) / 10).join(' ');

/**
 * The part of the world that frames `points` (the cities of a continent): their bounding
 * box with some padding, widened to a shape between square and the whole world's and
 * kept inside the world. Without points, the whole world.
 */
export function fitViewBox(points: readonly Point[], world: ViewBox): ViewBox {
  if (points.length === 0) return world;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs) - PADDING;
  const maxX = Math.max(...xs) + PADDING;
  const minY = Math.min(...ys) - PADDING;
  const maxY = Math.max(...ys) + PADDING;

  const maxAspect = world.width / world.height;
  let width = Math.max(maxX - minX, MIN_WIDTH);
  let height = maxY - minY;
  if (width / height > maxAspect) height = width / maxAspect;
  if (width / height < MIN_ASPECT) width = height * MIN_ASPECT;
  if (width >= world.width) return world;
  height = Math.min(height, world.height);

  const x = clamp((minX + maxX - width) / 2, world.x, world.x + world.width - width);
  const y = clamp((minY + maxY - height) / 2, world.y, world.y + world.height - height);
  return { x, y, width, height };
}

/** The view `t` (0–1) of the way from `from` to `to`. */
export function interpolateViewBox(from: ViewBox, to: ViewBox, t: number): ViewBox {
  const mix = (a: number, b: number) => a + (b - a) * t;
  return {
    x: mix(from.x, to.x),
    y: mix(from.y, to.y),
    width: mix(from.width, to.width),
    height: mix(from.height, to.height),
  };
}

export const sameViewBox = (a: ViewBox, b: ViewBox): boolean =>
  a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
