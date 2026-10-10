import type { ResultsResponse } from '@stb/contracts';
import { useState } from 'react';
import type { Finalist } from '../../lib/finalists';
import { formatCompactVotes, formatVotes } from '../../lib/format';
import { regionOf, type Selection } from '../../lib/selection';
import { netMargins, type MarginRow } from './net-margins';
import shell from './Insights.module.css';
import styles from './NetMarginCard.module.css';

interface Props {
  readonly data: ResultsResponse;
  readonly selection: Selection;
  readonly finalists: readonly Finalist[];
  readonly onSelect: (selection: Selection) => void;
}

/** Rows shown before "Ver todos". */
const COLLAPSED = 10;

/**
 * Where the lead comes from: the net votes each state (and abroad) adds to one finalist,
 * as a diverging bar chart with the first finalist on the left.
 */
export function NetMarginCard({ data, selection, finalists, onSelect }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [first, second] = finalists;
  const { rows, total, scale } = netMargins(data, finalists, selection);
  if (!first || !second || scale === 0) return null;

  const region = regionOf(selection);
  const collapsible = rows.length > COLLAPSED;
  const visible = collapsible && !expanded ? rows.slice(0, COLLAPSED) : rows;
  const ahead = total >= 0 ? first : second;

  return (
    <section className={`card ${shell.card}`} aria-labelledby="margins-title">
      <div className={shell.head}>
        <h2 id="margins-title" className={shell.title}>
          De onde vem a vantagem
        </h2>
        <p className={shell.subtitle}>
          Saldo de votos entre os finalistas em cada estado{region ? ' da região' : ''}.
        </p>
      </div>

      <p className={styles.total} data-hue={ahead.hue}>
        Saldo {region ? 'da região' : 'total'}: <strong>{ahead.shortName}</strong>{' '}
        <strong className={styles.totalValue}>+{formatVotes(Math.abs(total))}</strong> votos
      </p>

      <div className={styles.sides} aria-hidden="true">
        <span data-hue={first.hue}>← {first.shortName}</span>
        <span data-hue={second.hue}>{second.shortName} →</span>
      </div>

      <ul className={styles.list}>
        {visible.map((row) => (
          <li key={row.code}>
            <Row
              row={row}
              scale={scale}
              first={first}
              second={second}
              selected={isCurrent(row, selection)}
              onSelect={() => onSelect(row.target)}
            />
          </li>
        ))}
      </ul>

      {collapsible && (
        <button
          type="button"
          className={shell.more}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? 'Mostrar menos' : `Ver todos os ${rows.length}`}
        </button>
      )}
    </section>
  );
}

function isCurrent(row: MarginRow, selection: Selection): boolean {
  if (selection.kind === 'state') return row.code === selection.code;
  return selection.kind === 'abroad' && row.code === 'EXT';
}

interface RowProps {
  readonly row: MarginRow;
  readonly scale: number;
  readonly first: Finalist;
  readonly second: Finalist;
  readonly selected: boolean;
  readonly onSelect: () => void;
}

function Row({ row, scale, first, second, selected, onSelect }: RowProps) {
  const leader = row.margin > 0 ? first : row.margin < 0 ? second : undefined;
  const width = `${(Math.abs(row.margin) / scale) * 100}%`;
  const amount = leader ? `+${formatCompactVotes(Math.abs(row.margin))}` : '0';
  return (
    <button
      type="button"
      className={styles.row}
      aria-current={selected || undefined}
      aria-label={`${row.name}: ${leader ? `${leader.shortName} +${formatVotes(Math.abs(row.margin))} votos` : 'empate'}`}
      onClick={onSelect}
    >
      <span className={styles.code}>{row.code}</span>
      <span className={styles.bars} aria-hidden="true">
        <span className={styles.half} data-side="first">
          {row.margin > 0 && (
            <span className={styles.fill} data-hue={first.hue} style={{ width }} />
          )}
        </span>
        <span className={styles.half} data-side="second">
          {row.margin < 0 && (
            <span className={styles.fill} data-hue={second.hue} style={{ width }} />
          )}
        </span>
      </span>
      <span className={styles.value} data-hue={leader?.hue}>
        {amount}
      </span>
    </button>
  );
}
