import type { CandidateHue } from '../../lib/finalists';
import type { ShareContent } from './share-content';

/** The candidate's color as an emoji, so the text matches the site's colors. */
const HUE_EMOJI: Readonly<Record<CandidateHue, string>> = { red: '🔴', blue: '🔵' };

/**
 * The share image as text, for WhatsApp and other chats: the scope, each finalist's share
 * and votes, the count, the update time and a link back to the same scope.
 */
export function shareTextOf(content: ShareContent, url: string): string {
  const { m, f } = content.i18n;
  const heading = content.winner
    ? `✅ ${m.share.winnerHeading(content.winner.name)}`
    : content.round === 1
      ? `🗳️ ${m.share.firstRoundHeading(content.title)}`
      : `🗳️ ${m.share.runoffHeading(content.title)}`;
  const results = content.results.map(
    (r) =>
      `${HUE_EMOJI[r.hue]} ${r.name}: ${f.percent(r.share)} (${m.common.votes(r.votes, f.votes(r.votes))})`,
  );
  return [
    heading,
    '',
    ...results,
    '',
    `📊 ${m.common.sectionsCounted(f.counted(content.counted))}`,
    `🕒 ${content.source}`,
    '',
    content.round === 1 ? m.share.see(url) : m.share.follow(url),
  ].join('\n');
}
