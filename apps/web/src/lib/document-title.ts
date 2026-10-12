import { countedPercentage, type Tally } from '@stb/domain';
import { finalistResults, type Finalist } from './finalists';
import { formatPercent } from './format';

/** Title of `index.html`, kept until a vote is counted. */
export const SITE_TITLE = 'Segundo Turno 2026 · Apuração ao vivo';

/**
 * Tab title with the score of the scope on screen, so a tab left in the background still
 * shows how the count goes: `"Lula 52,13% × 47,87% Flávio · 87,40% apurado"`, prefixed
 * by the place outside Brazil as a whole (`"Bahia: …"`). The site title before any vote.
 */
export function documentTitle(tally: Tally, finalists: readonly Finalist[], place: string): string {
  const [first, second] = finalistResults(tally, finalists);
  if (!first || !second || first.votes + second.votes === 0) return SITE_TITLE;
  const counted = countedPercentage(tally);
  const where = place === 'Brasil' ? '' : `${place}: `;
  const score = `${first.shortName} ${formatPercent(first.share)} × ${formatPercent(second.share)} ${second.shortName}`;
  return `${where}${score} · ${counted >= 100 ? '100%' : formatPercent(counted)} apurado`;
}
