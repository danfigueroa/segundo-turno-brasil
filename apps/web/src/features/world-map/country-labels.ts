export interface Labeled {
  readonly name: string;
  /** Center of the name, in viewBox units. */
  readonly x: number;
  readonly y: number;
  /** How big the country is abroad (its polling stations): bigger ones are named first. */
  readonly weight: number;
}

interface Options {
  /** How many names at most. */
  readonly count: number;
  readonly fontSize: number;
  /** Width of the map, in viewBox units (it starts at 0). */
  readonly width: number;
}

/** Average width of a character, as a share of the font size. */
const CHAR_WIDTH = 0.6;
/** Room above and below a name, as a share of the font size. */
const LINE_HEIGHT = 1.3;

/**
 * The names written on a continent map: the countries with most polling stations first,
 * moved inside the map when they would run off an edge, skipping any that would overlap
 * a name already written.
 */
export function countryLabels(
  candidates: readonly Labeled[],
  { count, fontSize, width }: Options,
): Labeled[] {
  const half = (l: Labeled) => (l.name.length * fontSize * CHAR_WIDTH) / 2;
  const inside = (l: Labeled) => ({
    ...l,
    x: Math.min(Math.max(l.x, half(l)), width - half(l)),
  });
  const overlaps = (a: Labeled, b: Labeled) =>
    Math.abs(a.x - b.x) < half(a) + half(b) && Math.abs(a.y - b.y) < fontSize * LINE_HEIGHT;

  const sorted = [...candidates].sort(
    (a, b) => b.weight - a.weight || a.name.localeCompare(b.name),
  );
  const labeled: Labeled[] = [];
  for (const candidate of sorted.map(inside)) {
    if (labeled.length === count) break;
    if (!labeled.some((l) => overlaps(l, candidate))) labeled.push(candidate);
  }
  return labeled;
}
