import type { Tally } from '@stb/domain';
import type { CountryStandings } from '../../lib/countries';
import type { Finalist } from '../../lib/finalists';
import { formatPercent } from '../../lib/format';

const countries = (n: number) => (n === 1 ? '1 país' : `${n} países`);

function list(items: readonly string[]): string {
  return items.length <= 1
    ? (items[0] ?? '')
    : `${items.slice(0, -1).join(', ')} e ${items.at(-1) ?? ''}`;
}

/**
 * "Lula venceu em 64 países, Flávio em 36 e houve 1 empate (Guiné-Bissau). Abstenção no
 * exterior: 62,69%."
 */
export function abroadSummary(
  standings: CountryStandings,
  finalists: readonly Finalist[],
  abroad: Tally,
  final: boolean,
): string {
  const [first, second] = finalists;
  if (!first || !second) return '';
  const verb = final ? 'venceu' : 'lidera';
  const firstPart = `${first.shortName} ${verb} em ${countries(standings.wins[first.number] ?? 0)}`;
  const secondPart = `${second.shortName} em ${standings.wins[second.number] ?? 0}`;
  const { ties } = standings;
  const tiePart =
    ties.length === 0
      ? ''
      : ` e houve ${ties.length === 1 ? '1 empate' : `${ties.length} empates`} (${list(ties)})`;
  const sentence =
    ties.length === 0 ? `${firstPart} e ${secondPart}.` : `${firstPart}, ${secondPart}${tiePart}.`;
  if (abroad.electorate === 0) return sentence;
  const abstention = ((abroad.electorate - abroad.turnout) / abroad.electorate) * 100;
  return `${sentence} Abstenção no exterior: ${formatPercent(abstention)}.`;
}
