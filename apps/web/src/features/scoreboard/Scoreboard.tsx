import { countedPercentage, type Tally } from '@stb/domain';
import { AnimatedNumber } from '../../components/AnimatedNumber';
import { ProgressBar } from '../../components/ProgressBar';
import { finalistResults, leadOf, type Finalist } from '../../lib/finalists';
import { formatPercent, formatVotes } from '../../lib/format';
import styles from './Scoreboard.module.css';

interface Props {
  readonly title: string;
  readonly tally: Tally;
  readonly finalists: readonly Finalist[];
}

/** Headline result of the selected scope: both finalists, the split bar and counting progress. */
export function Scoreboard({ title, tally, finalists }: Props) {
  const results = finalistResults(tally, finalists);
  const lead = leadOf(results);
  const counted = countedPercentage(tally);
  const twoWayTotal = results.reduce((sum, r) => sum + r.votes, 0);

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
              {lead?.leader.number === r.number && <span className={styles.badge}>Lidera</span>}
            </div>
            <AnimatedNumber className={styles.share} value={r.share} format={formatPercent} />
            <div className={styles.meta}>
              {r.party} · <AnimatedNumber value={r.votes} format={formatVotes} /> votos
            </div>
          </div>
        ))}
      </div>

      <div className={styles.split} aria-hidden="true">
        {results.map((r) => (
          <div
            key={r.number}
            className={styles.segment}
            data-hue={r.hue}
            style={{ flexGrow: twoWayTotal === 0 ? 1 : r.votes }}
          />
        ))}
        <div className={styles.half} />
      </div>

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
