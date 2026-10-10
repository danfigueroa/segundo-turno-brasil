import type { ResultsResponse } from '@stb/contracts';
import { REGION_NAMES, STATE_CODES, STATES, type StateCode } from '@stb/domain';
import { useState } from 'react';
import { finalistResults, leadOf, type Finalist } from '../../lib/finalists';
import { formatLead, formatPercent } from '../../lib/format';
import { regionOf, type Selection } from '../../lib/selection';
import styles from './StatesList.module.css';

interface Props {
  readonly data: ResultsResponse;
  readonly finalists: readonly Finalist[];
  readonly selection: Selection;
  readonly onSelect: (selection: Selection) => void;
}

const BY_NAME = STATE_CODES.toSorted((a, b) => STATES[a].name.localeCompare(STATES[b].name));

function headingOf(selection: Selection): { title: string; subtitle: string } {
  const region = regionOf(selection);
  if (!region) {
    return {
      title: 'Resultado por estado',
      subtitle: 'Escolha um estado para ver os detalhes.',
    };
  }
  return {
    title:
      selection.kind === 'state'
        ? `Outros estados do ${REGION_NAMES[region]}`
        : `Estados da região ${REGION_NAMES[region]}`,
    subtitle: 'Vantagem em pontos percentuais.',
  };
}

/**
 * Every state (or the states of the selected region) with both shares and the lead: the
 * color-independent twin of the map. The full country list starts collapsed.
 */
export function StatesList({ data, finalists, selection, onSelect }: Props) {
  const [expanded, setExpanded] = useState(false);
  const region = regionOf(selection);
  const codes = region ? BY_NAME.filter((code) => STATES[code].region === region) : BY_NAME;
  const collapsible = !region;
  const { title, subtitle } = headingOf(selection);
  const [first, second] = finalists;

  return (
    <section className={`card ${styles.card}`} aria-labelledby="states-title">
      <div className={styles.head}>
        <h2 id="states-title" className={styles.title}>
          {title}
        </h2>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>

      <div className={styles.columns} aria-hidden="true">
        <span>Estado</span>
        <span>Distribuição</span>
        <span data-hue={first?.hue}>{first?.shortName}</span>
        <span data-hue={second?.hue}>{second?.shortName}</span>
        <span>Vantagem</span>
      </div>
      <ul className={styles.list} data-collapsed={(collapsible && !expanded) || undefined}>
        {codes.map((code) => (
          <li key={code}>
            <Row
              code={code}
              data={data}
              finalists={finalists}
              selected={selection.kind === 'state' && selection.code === code}
              onSelect={() => onSelect({ kind: 'state', code })}
            />
          </li>
        ))}
      </ul>

      {collapsible && (
        <button
          type="button"
          className={styles.more}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? 'Mostrar menos' : `Ver os ${codes.length} estados`}
        </button>
      )}
    </section>
  );
}

interface RowProps {
  readonly code: StateCode;
  readonly data: ResultsResponse;
  readonly finalists: readonly Finalist[];
  readonly selected: boolean;
  readonly onSelect: () => void;
}

function Row({ code, data, finalists, selected, onSelect }: RowProps) {
  const results = finalistResults(data.states[code], finalists);
  const lead = leadOf(results);
  const [first, second] = results;
  return (
    <button
      type="button"
      className={styles.row}
      aria-current={selected || undefined}
      onClick={onSelect}
    >
      <span
        className={styles.badge}
        data-hue={lead?.hue ?? 'none'}
        data-intensity={lead?.intensity ?? 0}
        aria-hidden="true"
      >
        {code}
      </span>
      <span className={styles.name}>{STATES[code].name}</span>
      <span className={styles.lead}>
        {lead ? `${lead.leader.shortName} ${formatLead(lead.margin)}` : 'Sem votos'}
      </span>
      <span className={styles.bar} aria-hidden="true">
        {first && (
          <span className={styles.part} data-hue={first.hue} style={{ width: `${first.share}%` }} />
        )}
        <span className={styles.gap} />
        {second && (
          <span
            className={styles.part}
            data-hue={second.hue}
            style={{ width: `${second.share}%` }}
          />
        )}
      </span>
      {results.map((r, index) => (
        <span
          key={r.number}
          className={styles.share}
          data-hue={r.hue}
          data-side={index === 0 ? 'first' : 'second'}
          data-leader={lead?.leader.number === r.number || undefined}
        >
          <span className={styles.shareName}>{r.shortName}</span> {formatPercent(r.share)}
        </span>
      ))}
    </button>
  );
}
