import type { Tally } from '@stb/domain';
import type { Finalist } from '../../lib/finalists';
import { formatCompactVotes, formatPercent, formatVotes } from '../../lib/format';
import { outlookView } from './outlook-view';
import shell from './Insights.module.css';
import styles from './OutlookCard.module.css';

interface Props {
  readonly tally: Tally;
  readonly finalists: readonly Finalist[];
  /** Where we are: "Brasil", "Bahia"… */
  readonly place: string;
}

/** "Ainda dá virada?": what the runner-up needs from the votes still to be counted. */
export function OutlookCard({ tally, finalists, place }: Props) {
  const view = outlookView(tally, finalists);
  if (!view) return null;
  const { runnerUp, leader } = view;

  return (
    <section className={`card ${shell.card}`} aria-labelledby="outlook-title">
      <div className={shell.head}>
        <div className={shell.titleRow}>
          <h2 id="outlook-title" className={shell.title}>
            Ainda dá virada?
          </h2>
          <span className={styles.pill} data-decided={view.decided || undefined}>
            {view.status}
          </span>
        </div>
        <p className={shell.subtitle}>
          Estimativa com base nas seções que faltam apurar em {place}.
        </p>
      </div>

      <div className={styles.answer}>
        <p className={styles.headline}>{view.headline}</p>
        <p className={styles.sentence}>{view.sentence}</p>
      </div>

      {view.needs !== undefined && (
        <div className={styles.gauge} data-hue={runnerUp.hue}>
          <div className={styles.gaugeLabel}>
            <span>Necessário para {runnerUp.shortName} virar</span>
            <strong className={styles.gaugeValue}>
              {view.needs >= 100 ? '+100%' : formatPercent(view.needs)}
            </strong>
          </div>
          <div className={styles.track} aria-hidden="true">
            <div className={styles.fill} style={{ width: `${view.needs}%` }} />
            <div className={styles.half} />
          </div>
          <div className={styles.scale} aria-hidden="true">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      )}

      <dl className={shell.stats}>
        <div className={shell.stat} data-hue={leader.hue}>
          <dt>Vantagem de {leader.shortName}</dt>
          <dd className={`${shell.statValue} ${styles.leadValue}`}>{formatVotes(view.lead)}</dd>
          <dd className={shell.statNote}>votos</dd>
        </div>
        <div className={shell.stat}>
          <dt>Faltam apurar</dt>
          <dd className={shell.statValue}>~{formatCompactVotes(view.remaining)}</dd>
          <dd className={shell.statNote}>votos válidos (estimativa)</dd>
        </div>
      </dl>
    </section>
  );
}
