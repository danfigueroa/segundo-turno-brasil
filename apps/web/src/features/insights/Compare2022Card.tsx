import { STATES } from '@stb/domain';
import { useI18n } from '../../i18n/i18n-context';
import type { Selection } from '../../lib/selection';
import type { Compare2022View } from './compare-2022';
import shell from './Insights.module.css';
import styles from './SwingCard.module.css';

interface Props {
  readonly view: Compare2022View;
  readonly place: string;
  readonly onSelect: (selection: Selection) => void;
}

/**
 * The runoff against the 2022 runoff, by ballot number: each finalist's share then and
 * now, the same moment of the 2022 count (Brazil) and the states led by the other number.
 */
export function Compare2022Card({ view, place, onSelect }: Props) {
  const { locale, m, f } = useI18n();
  const and = new Intl.ListFormat(locale, { type: 'conjunction' });
  return (
    <section className={`card ${shell.card}`} aria-labelledby="compare-2022-title">
      <div className={shell.head}>
        <h2 id="compare-2022-title" className={shell.title}>
          {m.insights.compare2022}
        </h2>
        <p className={shell.subtitle}>{m.insights.compare2022Text(place)}</p>
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
            <Bar label="2022" value={row.before} muted />
            <Bar label="2026" value={row.now} />
          </div>
        ))}
      </div>

      {view.atSameCount && (
        <p className={styles.others}>
          {m.insights.sameCount2022(
            f.percent(view.atSameCount.counted),
            and.format(
              view.rows.map((row, i) =>
                m.insights.had(row.name2022, f.percent(view.atSameCount?.shares[i] ?? 0)),
              ),
            ),
          )}
        </p>
      )}

      {view.flipped && (
        <div className={styles.flipped}>
          <h3 className={styles.flippedTitle}>{m.insights.flipped2022}</h3>
          {view.flipped.length === 0 ? (
            <p className={styles.none}>{m.insights.noneFlipped2022}</p>
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

      <p className={shell.note}>
        {m.insights.source2022}
        {view.counted < 100 && m.insights.partial2026(f.percent(view.counted))}
      </p>
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
