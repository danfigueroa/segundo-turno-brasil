import type { ResultsResponse } from '@stb/contracts';
import { countedPercentage, STATE_CODES, STATES } from '@stb/domain';
import { finalistResults, leadOf, type Finalist } from '../../lib/finalists';
import { formatPercent } from '../../lib/format';
import type { Selection } from '../../lib/selection';
import styles from './StatesTable.module.css';

interface Props {
  readonly data: ResultsResponse;
  readonly finalists: readonly Finalist[];
  readonly selection: Selection;
  readonly onSelect: (selection: Selection) => void;
}

/** Table view of every state: the accessible, color-independent twin of the map. */
export function StatesTable({ data, finalists, selection, onSelect }: Props) {
  const codes = STATE_CODES.filter(
    (code) => selection.kind !== 'region' || STATES[code].region === selection.code,
  ).toSorted((a, b) => STATES[a].name.localeCompare(STATES[b].name));

  return (
    <section className={`card ${styles.card}`} aria-labelledby="states-title">
      <h2 id="states-title" className={styles.title}>
        Resultado por estado
      </h2>
      <div className={styles.scroller}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Estado</th>
              {finalists.map((f) => (
                <th key={f.number} scope="col" className={styles.num} data-hue={f.hue}>
                  {f.name}
                </th>
              ))}
              <th scope="col" className={`${styles.num} ${styles.counted}`}>
                Apurado
              </th>
            </tr>
          </thead>
          <tbody>
            {codes.map((code) => {
              const results = finalistResults(data.states[code], finalists);
              const lead = leadOf(results);
              const selected = selection.kind === 'state' && selection.code === code;
              return (
                <tr key={code} data-selected={selected || undefined}>
                  <th scope="row">
                    <button
                      type="button"
                      className={styles.stateButton}
                      onClick={() => onSelect({ kind: 'state', code })}
                    >
                      <span className={styles.code}>{code}</span> {STATES[code].name}
                    </button>
                  </th>
                  {results.map((r) => (
                    <td
                      key={r.number}
                      className={styles.num}
                      data-leader={lead?.leader.number === r.number || undefined}
                    >
                      {formatPercent(r.share)}
                    </td>
                  ))}
                  <td className={`${styles.num} ${styles.muted} ${styles.counted}`}>
                    {formatPercent(countedPercentage(data.states[code]))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
