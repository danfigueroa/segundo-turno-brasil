import { formatPercent, formatVotes } from '../../lib/format';
import type { CandidateHue } from '../../lib/finalists';
import type { ShareContent } from './share-content';

/** The candidate's color as an emoji, so the text matches the site's colors. */
const HUE_EMOJI: Readonly<Record<CandidateHue, string>> = { red: '🔴', blue: '🔵' };

const formatCounted = (value: number) => (value >= 100 ? '100%' : formatPercent(value));

/**
 * The share image as text, for WhatsApp and other chats: the scope, each finalist's share
 * and votes, the count, the update time and a link back to the same scope.
 */
export function shareTextOf(content: ShareContent, url: string): string {
  const heading = content.winner
    ? `✅ ${content.winner.name} vence a eleição presidencial`
    : content.round === 1
      ? `🗳️ Resultado do 1º turno · ${content.title}`
      : `🗳️ Apuração do 2º turno · ${content.title}`;
  const results = content.results.map(
    (r) =>
      `${HUE_EMOJI[r.hue]} ${r.name}: ${formatPercent(r.share)} (${formatVotes(r.votes)} votos)`,
  );
  return [
    heading,
    '',
    ...results,
    '',
    `📊 ${formatCounted(content.counted)} das seções apuradas`,
    `🕒 ${content.source}`,
    '',
    `${content.round === 1 ? 'Veja' : 'Acompanhe ao vivo'}: ${url}`,
  ].join('\n');
}
