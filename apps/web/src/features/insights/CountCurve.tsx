import type { ResultsResponse } from '@stb/contracts';
import { paceOf, type CountPoint } from '@stb/domain';
import { useHistory } from '../../api/history';
import type { I18n } from '../../i18n/i18n';
import { useI18n } from '../../i18n/i18n-context';
import type { Finalist } from '../../lib/finalists';
import type { Selection } from '../../lib/selection';
import { curveOf, mergePoints, type Curve } from './curve';
import { liveSeries } from './live-history';
import shell from './Insights.module.css';
import styles from './CountCurve.module.css';

interface Props {
  readonly runoff: ResultsResponse;
  readonly selection: Selection;
  readonly finalists: readonly Finalist[];
}

/** Whole percentages for the axes: `"80%"`. */
const axisFormat = (locale: string) => {
  const format = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 });
  return (value: number) => format.format(value / 100);
};

function describeCurve(curve: Curve, counted: number, { locale, m, f }: I18n): string {
  const formatAxis = axisFormat(locale);
  const lines = curve.lines.map((l) => `${l.finalist.shortName} ${f.percent(l.last)}`);
  const changes = curve.changes.map((c) =>
    m.insights.overtook(c.leader.shortName, formatAxis(c.counted)),
  );
  return [m.insights.curveNow(lines.join(', '), formatAxis(counted)), ...changes].join('. ');
}

/** Runoff count curve of the selection, with the counting pace and expected end. */
export function CountCurve({ runoff, selection, finalists }: Props) {
  const i18n = useI18n();
  const { m, f } = i18n;
  const formatAxis = axisFormat(i18n.locale);
  const history = useHistory(selection);
  const points: CountPoint[] = mergePoints(
    history.data?.points ?? [],
    liveSeries(runoff, selection),
  );
  const curve = curveOf(points, finalists);
  const last = points.at(-1);
  if (!curve || !last) return null;

  const counted = last.total === 0 ? 0 : (last.counted / last.total) * 100;
  const pace = paceOf(points);
  const done = last.counted >= last.total;

  return (
    <section className={`card ${shell.card}`} aria-labelledby="curve-title">
      <div className={shell.head}>
        <h2 id="curve-title" className={shell.title}>
          {m.insights.curve}
        </h2>
        <p className={shell.subtitle}>{m.insights.curveText}</p>
      </div>

      <ul className={styles.legend} aria-label={m.insights.legend}>
        {curve.lines.map((line) => (
          <li key={line.finalist.number} data-hue={line.finalist.hue}>
            <span className={styles.swatch} aria-hidden="true" />
            {line.finalist.shortName}
            <strong>{f.percent(line.last)}</strong>
          </li>
        ))}
      </ul>

      <div className={styles.chart} role="img" aria-label={describeCurve(curve, counted, i18n)}>
        <div className={styles.yAxis} aria-hidden="true">
          <span style={{ top: '0%' }}>{formatAxis(curve.yMax)}</span>
          <span style={{ top: `${curve.middle}%` }}>{formatAxis(50)}</span>
          <span style={{ top: '100%' }}>{formatAxis(curve.yMin)}</span>
        </div>
        <div className={styles.plot}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={styles.svg}>
            <line x1="0" x2="100" y1={curve.middle} y2={curve.middle} className={styles.half} />
            {curve.lines.map((line) => (
              <path
                key={line.finalist.number}
                d={line.path}
                className={styles.line}
                data-hue={line.finalist.hue}
              />
            ))}
          </svg>
          {curve.changes.map((change) => (
            <span
              key={change.counted}
              className={styles.change}
              style={{ left: `${change.x}%`, top: `${change.y}%` }}
            >
              <span className={styles.changeLabel}>
                {m.insights.turnaround(formatAxis(change.counted))}
              </span>
            </span>
          ))}
          {curve.lines.map((line) => (
            <span
              key={line.finalist.number}
              className={styles.dot}
              data-hue={line.finalist.hue}
              style={{ left: `${line.end.x}%`, top: `${line.end.y}%` }}
            />
          ))}
        </div>
        <div className={styles.xAxis} aria-hidden="true">
          <span>{formatAxis(0)}</span>
          <span>{formatAxis(50)}</span>
          <span>{m.common.counted(formatAxis(100))}</span>
        </div>
      </div>

      <dl className={shell.stats}>
        <div className={shell.stat}>
          <dt>{m.insights.pace}</dt>
          <dd className={shell.statValue}>
            {pace && !done ? f.votes(pace.sectionsPerMinute) : '—'}
          </dd>
          <dd className={shell.statNote}>
            {done ? m.insights.countDone : pace ? m.insights.perMinute : m.insights.collecting}
          </dd>
        </div>
        <div className={shell.stat}>
          <dt>{m.insights.eta}</dt>
          <dd className={shell.statValue}>{pace?.eta && !done ? f.time(pace.eta) : '—'}</dd>
          <dd className={shell.statNote}>
            {pace && !done ? m.insights.sectionsLeft(f.votes(pace.remainingSections)) : ''}
          </dd>
        </div>
      </dl>
    </section>
  );
}
