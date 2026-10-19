import type { ResultsResponse } from '@stb/contracts';
import { STATE_CODES, STATES, type StateCode } from '@stb/domain';
import { useState } from 'react';
import { useI18n } from '../../i18n/i18n-context';
import type { Messages } from '../../i18n/messages/pt-BR';
import { finalistResults, leadOf, type Finalist } from '../../lib/finalists';
import { regionOf, type Selection } from '../../lib/selection';
import { useMediaQuery } from '../../lib/use-media-query';
import { prefetchStateMap } from '../state-map/state-maps';
import styles from './StatesList.module.css';

interface Props {
  readonly data: ResultsResponse;
  readonly finalists: readonly Finalist[];
  readonly selection: Selection;
  readonly onSelect: (selection: Selection) => void;
}

const BY_NAME = STATE_CODES.toSorted((a, b) =>
  STATES[a].name.localeCompare(STATES[b].name, 'pt-BR'),
);

/** Copy differs between phones (touch, compact) and wide screens, as in the design. */
function headingOf(
  selection: Selection,
  wide: boolean,
  { lists, places }: Messages,
): { title: string; subtitle: string } {
  const region = regionOf(selection);
  if (!region) {
    return { title: lists.byState, subtitle: wide ? lists.clickState : lists.tapState };
  }
  const name = places.regions[region];
  const regionTitle = wide ? lists.regionStatesOf(name) : lists.regionStates;
  return {
    title: selection.kind === 'state' ? lists.otherStates(name) : regionTitle,
    subtitle: wide ? lists.leadInPoints : lists.differenceInPoints,
  };
}

/**
 * Every state (or the states of the selected region) with both shares and the lead: the
 * color-independent twin of the map. The full country list starts collapsed.
 */
export function StatesList({ data, finalists, selection, onSelect }: Props) {
  const { m } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const wide = useMediaQuery('(min-width: 960px)');
  const region = regionOf(selection);
  const codes = region ? BY_NAME.filter((code) => STATES[code].region === region) : BY_NAME;
  const collapsible = !region;
  const { title, subtitle } = headingOf(selection, wide, m);
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
        <span>{m.lists.state}</span>
        <span>{m.lists.distribution}</span>
        <span data-hue={first?.hue}>{first?.shortName}</span>
        <span data-hue={second?.hue}>{second?.shortName}</span>
        <span>{m.lists.lead}</span>
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
          {expanded
            ? m.lists.showLess
            : (wide ? m.lists.showStates : m.lists.seeStates)(codes.length)}
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
  const { m, f } = useI18n();
  const results = finalistResults(data.states[code], finalists);
  const lead = leadOf(results);
  const [first, second] = results;
  return (
    <button
      type="button"
      className={styles.row}
      aria-current={selected || undefined}
      onPointerDown={() => prefetchStateMap(code)}
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
        {lead ? `${lead.leader.shortName} ${f.lead(lead.margin, decimals)}` : m.lists.noVotes}
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
          <span className={styles.shareName}>{r.shortName}</span> {f.percent(r.share)}
        </span>
      ))}
    </button>
  );
}
