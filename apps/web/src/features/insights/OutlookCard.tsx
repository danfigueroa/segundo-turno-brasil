import type { Tally } from '@stb/domain';
import { useI18n } from '../../i18n/i18n-context';
import type { Finalist } from '../../lib/finalists';
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
  const i18n = useI18n();
  const { m, f } = i18n;
  const view = outlookView(tally, finalists, i18n);
  if (!view) return null;
  const { runnerUp, leader } = view;

  return (
    <section className={`card ${shell.card}`} aria-labelledby="outlook-title">
      <div className={shell.head}>
        <div className={shell.titleRow}>
          <h2 id="outlook-title" className={shell.title}>
            {m.insights.outlook}
          </h2>
          <span className={styles.pill} data-decided={view.decided || undefined}>
            {view.status}
          </span>
        </div>
        <p className={shell.subtitle}>{m.insights.outlookBasis(place)}</p>
      </div>

      <div className={styles.answer}>
        <p className={styles.headline}>{view.headline}</p>
        <p className={styles.sentence}>{view.sentence}</p>
      </div>

      {view.needs !== undefined && (
        <div className={styles.gauge} data-hue={runnerUp.hue}>
          <div className={styles.gaugeLabel}>
            <span>{m.insights.needs(runnerUp.shortName)}</span>
            <strong className={styles.gaugeValue}>
              {view.needs >= 100 ? `+${f.counted(100)}` : f.percent(view.needs)}
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
          <dt>{m.insights.leadOf(leader.shortName)}</dt>
          <dd className={`${shell.statValue} ${styles.leadValue}`}>{f.votes(view.lead)}</dd>
          <dd className={shell.statNote}>{m.insights.votes}</dd>
        </div>
        <div className={shell.stat}>
          <dt>{m.insights.remaining}</dt>
          <dd className={shell.statValue}>~{f.compactVotes(view.remaining)}</dd>
          <dd className={shell.statNote}>{m.insights.remainingNote}</dd>
        </div>
      </dl>
    </section>
  );
}
