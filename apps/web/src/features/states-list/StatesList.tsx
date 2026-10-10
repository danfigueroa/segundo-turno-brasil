import type { ResultsResponse } from '@stb/contracts';
import { REGION_NAMES, STATE_CODES, STATES, type StateCode } from '@stb/domain';
import { useState } from 'react';
import { finalistResults, leadOf, type Finalist } from '../../lib/finalists';
import { formatLead, formatPercent } from '../../lib/format';
import { regionOf, type Selection } from '../../lib/selection';
import { useMediaQuery } from '../../lib/use-media-query';
import styles from './StatesList.module.css';

interface Props {
  readonly data: ResultsResponse;
  readonly finalists: readonly Finalist[];
  readonly selection: Selection;
  readonly onSelect: (selection: Selection) => void;
}

const BY_NAME = STATE_CODES.toSorted((a, b) => STATES[a].name.localeCompare(STATES[b].name));

/** Copy differs between phones (touch, compact) and wide screens, as in the design. */
function headingOf(selection: Selection, wide: boolean): { title: string; subtitle: string } {
  const region = regionOf(selection);
  if (!region) {
    return {
      title: 'Resultado por estado',
      subtitle: wide
        ? 'Clique em uma linha para ver os detalhes do estado.'
        : 'Toque em um estado para ver os detalhes.',
    };
  }
  const regionTitle = wide ? `Estados da região ${REGION_NAMES[region]}` : 'Estados da região';
  return {
    title: selection.kind === 'state' ? `Outros estados do ${REGION_NAMES[region]}` : regionTitle,
    subtitle: wide ? 'Vantagem em pontos percentuais.' : 'Diferença em pontos percentuais.',
  };
}

/**
 * Every state (or the states of the selected region) with both shares and the lead: the
 * color-independent twin of the map. The full country list starts collapsed.
 */
export function StatesList({ data, finalists, selection, onSelect }: Props) {
  const [expanded, setExpanded] = useState(false);
  const wide = useMediaQuery('(min-width: 960px)');
  const region = regionOf(selection);
  const codes = region ? BY_NAME.filter((code) => STATES[code].region === region) : BY_NAME;
  const collapsible = !region;
  const { title, subtitle } = headingOf(selection, wide);
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
              decimals={wide ? 2 : 1}
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
          {expanded ? 'Mostrar menos' : `${wide ? 'Mostrar' : 'Ver'} os ${codes.length} estados`}
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
  readonly decimals: 1 | 2;
  readonly onSelect: () => void;
}

function Row({ code, data, finalists, selected, decimals, onSelect }: RowProps) {
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
        {lead ? `${lead.leader.shortName} ${formatLead(lead.margin, decimals)}` : 'Sem votos'}
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
