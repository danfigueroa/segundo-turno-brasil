import type { ResultsResponse } from '@stb/contracts';
import { STATES } from '@stb/domain';
import { useI18n } from '../../i18n/i18n-context';
import type { Finalist } from '../../lib/finalists';
import type { Selection } from '../../lib/selection';
import { swingView } from './swing-view';
import shell from './Insights.module.css';
import styles from './SwingCard.module.css';

interface Props {
  readonly firstRound: ResultsResponse;
  readonly runoff: ResultsResponse;
  readonly selection: Selection;
  readonly finalists: readonly Finalist[];
  readonly place: string;
  readonly onSelect: (selection: Selection) => void;
}

/** Runoff against the first round: each finalist's change and the states that flipped. */
export function SwingCard({ firstRound, runoff, selection, finalists, place, onSelect }: Props) {
  const { m, f } = useI18n();
  const view = swingView(firstRound, runoff, selection, finalists);

  return (
    <section className={`card ${shell.card}`} aria-labelledby="swing-title">
      <div className={shell.head}>
        <h2 id="swing-title" className={shell.title}>
          {m.insights.swing}
        </h2>
        <p className={shell.subtitle}>{m.insights.swingText(place)}</p>
      </div>

      <div className={styles.rows}>
        {view.rows.map((row) => (
          <div key={row.finalist.number} className={styles.row} data-hue={row.finalist.hue}>
            <div className={styles.rowHead}>
              <span className={styles.name}>{row.finalist.name}</span>
              <span className={styles.change} data-down={row.change < 0 || undefined}>
                {f.pointsChange(row.change)}
              </span>
            </div>
            <Bar label={m.round.labels[1]} value={row.before} muted />
            <Bar label={m.round.labels[2]} value={row.now} />
          </div>
        ))}
      </div>

      <p className={styles.others}>
        {m.insights.othersFirstRound(
          f.percent(view.others.share),
          m.common.votes(view.others.votes, f.votes(view.others.votes)),
        )}
      </p>

      {view.flipped && (
        <div className={styles.flipped}>
          <h3 className={styles.flippedTitle}>{m.insights.flipped}</h3>
          {view.flipped.length === 0 ? (
            <p className={styles.none}>{m.insights.noneFlipped}</p>
          ) : (
            <div className={styles.chips}>
              {view.flipped.map(({ code, from, to }) => (
                <button
                  key={code}
                  type="button"
                  className={styles.chip}
                  onClick={() => onSelect({ kind: 'state', code })}
                >
                  <span className={styles.code}>{code}</span>
                  <span className="visually-hidden">{STATES[code].name}: </span>
                  <span data-hue={from.hue} className={styles.from}>
                    {from.shortName}
                  </span>
                  <span aria-label={m.insights.to}>→</span>
                  <span data-hue={to.hue} className={styles.to}>
                    {to.shortName}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {view.counted < 100 && (
        <p className={shell.note}>{m.insights.partialRunoff(f.percent(view.counted))}</p>
      )}
    </section>
  );
}

function Bar({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  const { f } = useI18n();
  return (
    <div className={styles.bar} data-muted={muted || undefined}>
      <span className={styles.barLabel}>{label}</span>
      <span className={styles.track} aria-hidden="true">
        <span className={styles.fill} style={{ width: `${value}%` }} />
      </span>
      <span className={styles.barValue}>{f.percent(value)}</span>
    </div>
  );
}
