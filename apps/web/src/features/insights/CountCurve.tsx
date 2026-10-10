import type { ResultsResponse } from '@stb/contracts';
import { paceOf, type CountPoint } from '@stb/domain';
import { useHistory } from '../../api/history';
import type { Finalist } from '../../lib/finalists';
import { formatPercent, formatTime, formatVotes } from '../../lib/format';
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

const formatAxis = (value: number) => `${Math.round(value)}%`;

function describeCurve(curve: Curve, counted: number): string {
  const lines = curve.lines.map((l) => `${l.finalist.shortName} ${formatPercent(l.last)}`);
  const changes = curve.changes.map(
    (c) => `${c.leader.shortName} passou à frente com ${formatAxis(c.counted)} apurado`,
  );
  return [`${lines.join(', ')} com ${formatAxis(counted)} das seções apuradas`, ...changes].join(
    '. ',
  );
}

/** Runoff count curve of the selection, with the counting pace and expected end. */
export function CountCurve({ runoff, selection, finalists }: Props) {
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
          Como a apuração evoluiu
        </h2>
        <p className={shell.subtitle}>
          Votos válidos de cada finalista conforme as seções são apuradas.
        </p>
      </div>

      <ul className={styles.legend} aria-label="Legenda">
        {curve.lines.map((line) => (
          <li key={line.finalist.number} data-hue={line.finalist.hue}>
            <span className={styles.swatch} aria-hidden="true" />
            {line.finalist.shortName}
            <strong>{formatPercent(line.last)}</strong>
          </li>
        ))}
      </ul>

      <div className={styles.chart} role="img" aria-label={describeCurve(curve, counted)}>
        <div className={styles.yAxis} aria-hidden="true">
          <span style={{ top: '0%' }}>{formatAxis(curve.yMax)}</span>
          <span style={{ top: `${curve.middle}%` }}>50%</span>
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
              <span className={styles.changeLabel}>Virada · {formatAxis(change.counted)}</span>
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
          <span>0%</span>
          <span>50%</span>
          <span>100% apurado</span>
        </div>
      </div>

      <dl className={shell.stats}>
        <div className={shell.stat}>
          <dt>Ritmo</dt>
          <dd className={shell.statValue}>
            {pace && !done ? formatVotes(pace.sectionsPerMinute) : '—'}
          </dd>
          <dd className={shell.statNote}>
            {done ? 'Apuração concluída' : pace ? 'seções por minuto' : 'Coletando dados…'}
          </dd>
        </div>
        <div className={shell.stat}>
          <dt>Previsão de 100%</dt>
          <dd className={shell.statValue}>{pace?.eta && !done ? formatTime(pace.eta) : '—'}</dd>
          <dd className={shell.statNote}>
            {pace && !done ? `${formatVotes(pace.remainingSections)} seções restantes` : ''}
          </dd>
        </div>
      </dl>
    </section>
  );
}
