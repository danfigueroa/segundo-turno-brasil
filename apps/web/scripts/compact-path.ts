/**
 * Rewrites an SVG path of integer `M`/`L`/`Z` commands (what `geoPath().digits(0)`
 * writes) with relative commands, dropping points repeated by the rounding. The same
 * shape in about half the bytes: small deltas instead of absolute coordinates.
 */
export function compactPath(d: string): string {
  if (!/^[MLZ\d,-]*$/.test(d)) throw new Error(`Unexpected path command in ${d.slice(0, 40)}`);
  let out = '';
  // Current point, and where the current subpath started (where `Z` returns to).
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  // After an `l`, the next line can leave its letter out.
  let afterLine = false;
  for (const [, command, args] of d.matchAll(/([MLZ])([^MLZ]*)/g)) {
    if (command === 'Z') {
      out += 'z';
      x = startX;
      y = startY;
      afterLine = false;
      continue;
    }
    const [px, py] = (args ?? '').split(',').map(Number);
    if (px === undefined || py === undefined || Number.isNaN(px) || Number.isNaN(py)) {
      throw new Error(`Bad point "${args ?? ''}" in ${d.slice(0, 40)}`);
    }
    const dx = px - x;
    const dy = py - y;
    if (command === 'L' && dx === 0 && dy === 0) continue;
    // A minus sign separates numbers as well as a comma or a space does.
    const pair = `${dx}${dy < 0 ? '' : ','}${dy}`;
    if (command === 'L' && afterLine) out += `${dx < 0 ? '' : ' '}${pair}`;
    else out += `${command === 'M' ? 'm' : 'l'}${pair}`;
    x = px;
    y = py;
    if (command === 'M') {
      startX = px;
      startY = py;
    }
    afterLine = command === 'L';
  }
  return out;
}
