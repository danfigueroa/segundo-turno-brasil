import { countedPercentage, type Tally } from '@stb/domain';
import { AnimatedNumber } from '../../components/AnimatedNumber';
import { ProgressBar } from '../../components/ProgressBar';
import { finalistResults, leadOf, type Finalist } from '../../lib/finalists';
import { formatName, formatPercent, formatVotes } from '../../lib/format';
import styles from './Scoreboard.module.css';

interface Props {
  readonly title: string;
  readonly tally: Tally;
  readonly finalists: readonly Finalist[];
}

/**
 * Headline result of the selected scope: both finalists, the vote bar and counting
 * progress. In the first round, the other candidates are listed below and fill the bar
 * in gray, so the 50% marker reads as the absolute-majority threshold.
 */
export function Scoreboard({ title, tally, finalists }: Props) {
  const results = finalistResults(tally, finalists);
  const lead = leadOf(results);
  const counted = countedPercentage(tally);
  const finalistNumbers = new Set(finalists.map((f) => f.number));
  const others = tally.candidates.filter((c) => !finalistNumbers.has(c.number));
  const othersVotes = others.reduce((sum, c) => sum + c.votes, 0);
  const anyVotes = results.some((r) => r.votes > 0) || othersVotes > 0;
  const leaderBadge = counted >= 100 ? 'Mais votado' : 'Lidera';

  return (
    <section className={`card ${styles.scoreboard}`} aria-labelledby="scoreboard-title">
      <h2 id="scoreboard-title" className={styles.title}>
        {title}
      </h2>

      <div className={styles.candidates}>
        {results.map((r) => (
          <div key={r.number} className={styles.candidate} data-hue={r.hue}>
            <div className={styles.nameRow}>
              <span className={styles.swatch} aria-hidden="true" />
              <span className={styles.name}>{r.name}</span>
              {lead?.leader.number === r.number && (
                <span className={styles.badge}>{leaderBadge}</span>
              )}
            </div>
            <AnimatedNumber className={styles.share} value={r.share} format={formatPercent} />
            <div className={styles.meta}>
              {r.party} · <AnimatedNumber value={r.votes} format={formatVotes} /> votos
            </div>
          </div>
        ))}
      </div>

      <div className={styles.split} aria-hidden="true" data-empty={!anyVotes || undefined}>
        {results.map((r) => (
          <div
            key={r.number}
            className={styles.segment}
            data-hue={r.hue}
            style={{ flexGrow: anyVotes ? r.votes : 1 }}
          />
        ))}
        {othersVotes > 0 && (
          <div className={styles.segment} data-hue="other" style={{ flexGrow: othersVotes }} />
        )}
        <div className={styles.half} />
      </div>

      {others.length > 0 && (
        <details className={styles.others}>
          <summary>
            Demais candidatos · {formatPercent(others.reduce((sum, c) => sum + c.share, 0))}
          </summary>
          <ol className={styles.othersList}>
            {others.map((c) => (
              <li key={c.number}>
                <span>
                  {formatName(c.name)} <span className={styles.othersParty}>{c.party}</span>
                </span>
                <span className={styles.othersShare}>{formatPercent(c.share)}</span>
              </li>
            ))}
          </ol>
        </details>
      )}

      <div className={styles.progress}>
        <div className={styles.progressLabel}>
          <span>
            <AnimatedNumber value={counted} format={formatPercent} /> das seções apuradas
          </span>
        </div>
        <ProgressBar value={counted} label="Seções apuradas" />
      </div>
    </section>
  );
}
