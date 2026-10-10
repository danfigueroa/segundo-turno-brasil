/** Where the name of the selected municipality goes, in viewBox coordinates. */
export interface CityLabel {
  readonly x: number;
  readonly y: number;
  /** Whether the text sits above the shape (`'above'`) or, near the top edge, below it. */
  readonly side: 'above' | 'below';
}

interface Bounds {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

/** Bounding box of a pre-projected path (absolute `M`/`L` commands only). */
export function pathBounds(d: string): Bounds | undefined {
  const numbers = d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  if (numbers.length < 2) return undefined;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i + 1 < numbers.length; i += 2) {
    const x = numbers[i] ?? 0;
    const y = numbers[i + 1] ?? 0;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Places the city name just above its shape, centered on it but kept off the left and
 * right edges; a city at the top of the state gets its name below instead.
 */
export function cityLabel(d: string, viewBox: string, fontSize: number): CityLabel | undefined {
  const bounds = pathBounds(d);
  const [vx = 0, vy = 0, vw = 0] = viewBox.split(/[\s,]+/).map(Number);
  if (!bounds || vw <= 0) return undefined;
  const gap = fontSize * 0.4;
  const center = (bounds.minX + bounds.maxX) / 2;
  const x = Math.min(Math.max(center, vx + vw * 0.2), vx + vw * 0.8);
  if (bounds.minY - gap - fontSize >= vy) return { x, y: bounds.minY - gap, side: 'above' };
  return { x, y: bounds.maxY + gap, side: 'below' };
}
