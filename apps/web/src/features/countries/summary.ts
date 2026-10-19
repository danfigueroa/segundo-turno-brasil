import type { Tally } from '@stb/domain';
import type { I18n } from '../../i18n/i18n';
import type { CountryStandings } from '../../lib/countries';
import type { Finalist } from '../../lib/finalists';

/**
 * "Lula venceu em 64 países, Flávio em 36 e houve 1 empate (Guiné-Bissau). Abstenção no
 * exterior: 62,69%."
 */
export function abroadSummary(
  standings: CountryStandings,
  finalists: readonly Finalist[],
  abroad: Tally,
  final: boolean,
  { locale, m, f, country }: I18n,
): string {
  const [first, second] = finalists;
  if (!first || !second) return '';
  const { ties } = standings;
  const tied = new Intl.ListFormat(locale, { type: 'conjunction' }).format(ties.map(country));
  const sentence = m.lists.abroadWins(
    final,
    first.shortName,
    standings.wins[first.number] ?? 0,
    second.shortName,
    standings.wins[second.number] ?? 0,
    ties.length,
    tied,
  );
  if (abroad.electorate === 0) return sentence;
  const abstention = ((abroad.electorate - abroad.turnout) / abroad.electorate) * 100;
  return `${sentence} ${m.lists.abroadAbstention(f.percent(abstention))}`;
}
