import { countedPercentage, type Tally } from '@stb/domain';
import { finalistResults, type Finalist } from './finalists';
import type { I18n } from '../i18n/i18n';

/**
 * Tab title with the score of the scope on screen, so a tab left in the background still
 * shows how the count goes: `"Lula 52,13% × 47,87% Flávio · 87,40% apurado"`, prefixed
 * by the place outside Brazil as a whole (`"Bahia: …"`). The site title before any vote.
 */
export function documentTitle(
  tally: Tally,
  finalists: readonly Finalist[],
  /** Where, or `undefined` for Brazil as a whole. */
  place: string | undefined,
  { m, f }: I18n,
): string {
  const [first, second] = finalistResults(tally, finalists);
  if (!first || !second || first.votes + second.votes === 0) return m.site.title;
  const where = place === undefined ? '' : `${place}: `;
  const score = `${first.shortName} ${f.percent(first.share)} × ${f.percent(second.share)} ${second.shortName}`;
  return `${where}${score} · ${m.common.counted(f.counted(countedPercentage(tally)))}`;
}
