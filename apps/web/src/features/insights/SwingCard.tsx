import type { ResultsResponse } from '@stb/contracts';
import { STATES } from '@stb/domain';
import type { Finalist } from '../../lib/finalists';
import { formatPercent, formatPointsChange, formatVotes } from '../../lib/format';
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
  const view = swingView(firstRound, runoff, selection, finalists);

  return (
    <section className={`card ${shell.card}`} aria-labelledby="swing-title">
      <div className={shell.head}>
        <h2 id="swing-title" className={shell.title}>
          Do 1º para o 2º turno
        </h2>
        <p className={shell.subtitle}>Votos válidos de cada finalista em {place}.</p>
      </div>

      <div className={styles.rows}>
        {view.rows.map((row) => (
          <div key={row.finalist.number} className={styles.row} data-hue={row.finalist.hue}>
            <div className={styles.rowHead}>
              <span className={styles.name}>{row.finalist.name}</span>
              <span className={styles.change} data-down={row.change < 0 || undefined}>
                {formatPointsChange(row.change)}
              </span>
            </div>
            <Bar label="1º turno" value={row.before} muted />
            <Bar label="2º turno" value={row.now} />
          </div>
        ))}
      </div>

      <p className={styles.others}>
        No 1º turno, os demais candidatos somaram{' '}
        <strong>{formatPercent(view.others.share)}</strong> dos votos válidos (
        {formatVotes(view.others.votes)} votos).
      </p>

      {view.flipped && (
        <div className={styles.flipped}>
          <h3 className={styles.flippedTitle}>Estados com outro líder</h3>
          {view.flipped.length === 0 ? (
            <p className={styles.none}>Os mesmos líderes do 1º turno em todos os estados.</p>
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
                  <span aria-label="para">→</span>
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
        <p className={shell.note}>
          Parcial do 2º turno: {formatPercent(view.counted)} das seções apuradas.
        </p>
      )}
    </section>
  );
}

function Bar({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className={styles.bar} data-muted={muted || undefined}>
      <span className={styles.barLabel}>{label}</span>
      <span className={styles.track} aria-hidden="true">
        <span className={styles.fill} style={{ width: `${value}%` }} />
      </span>
      <span className={styles.barValue}>{formatPercent(value)}</span>
    </div>
  );
}
