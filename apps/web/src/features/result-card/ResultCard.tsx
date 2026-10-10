import type { ResultsResponse } from '@stb/contracts';
import type { ReactNode, Ref } from 'react';
import { AnimatedNumber } from '../../components/AnimatedNumber';
import { ProgressBar } from '../../components/ProgressBar';
import type { Finalist } from '../../lib/finalists';
import { formatPercent } from '../../lib/format';
import { breadcrumbsOf, isSameSelection, type Selection } from '../../lib/selection';
import { headlineOf, type HeadlineColumn } from './headline';
import styles from './ResultCard.module.css';

interface Props {
  readonly data: ResultsResponse;
  readonly selection: Selection;
  readonly finalists: readonly Finalist[];
  readonly onSelect: (selection: Selection) => void;
  /** Actions at the bottom of the card, e.g. sharing. */
  readonly children?: ReactNode;
  readonly ref?: Ref<HTMLElement>;
}

const formatCount = (value: number) => String(Math.round(value));
const formatCounted = (value: number) => (value >= 100 ? '100%' : formatPercent(value));

/**
 * Headline of the selection: where we are (breadcrumbs), both finalists side by side, the
 * vote bar with the 50% marker, three key figures and the share action.
 */
export function ResultCard({ data, selection, finalists, onSelect, children, ref }: Props) {
  const headline = headlineOf(data, selection, finalists);
  const crumbs = breadcrumbsOf(selection);
  const total = headline.bar.reduce((sum, s) => sum + s.weight, 0);
  const live = headline.counted > 0 && headline.counted < 100;

  return (
    <section ref={ref} className={`card ${styles.card}`} aria-labelledby="result-title">
      <div className={styles.top}>
        <nav aria-label="Você está em" className={styles.crumbs}>
          {crumbs.map((crumb, index) => {
            const current = isSameSelection(crumb.target, selection);
            return (
              <span key={crumb.label} className={styles.crumb}>
                {index > 0 && (
                  <span className={styles.separator} aria-hidden="true">
                    ›
                  </span>
                )}
                <button
                  type="button"
                  className={styles.crumbButton}
                  aria-current={current ? 'location' : undefined}
                  onClick={() => onSelect(crumb.target)}
                >
                  {crumb.label}
                </button>
              </span>
            );
          })}
        </nav>
        <span className={styles.counted}>{formatCounted(headline.counted)} apurado</span>
      </div>
      {live && <ProgressBar value={headline.counted} label="Seções apuradas" />}

      <div className={styles.heading}>
        <div className={styles.eyebrow}>{headline.eyebrow}</div>
        <h1 id="result-title" className={styles.title}>
          {headline.title}
        </h1>
      </div>

      <div className={styles.columns}>
        {headline.columns.map((column) => (
          <Column key={column.finalist.number} column={column} badge={headline.badge} />
        ))}
      </div>

      <div className={styles.barBlock} aria-hidden="true">
        <div className={styles.barTrack}>
          <div className={styles.bar}>
            {total > 0 &&
              headline.bar.map((segment) => (
                <div
                  key={segment.key}
                  className={styles.segment}
                  data-tone={segment.tone}
                  style={{ flexGrow: segment.weight }}
                />
              ))}
          </div>
          <div className={styles.half} />
        </div>
        <div className={styles.barLabel}>{headline.barLabel}</div>
      </div>

      <dl className={styles.stats}>
        {headline.stats.map((stat) => (
          <div key={stat.label} className={styles.stat}>
            <dt>{stat.label}</dt>
            <dd className={styles.statValue}>{stat.value}</dd>
            {stat.note && <dd className={styles.statNote}>{stat.note}</dd>}
          </div>
        ))}
      </dl>

      {children}
    </section>
  );
}

function Column({ column, badge }: { readonly column: HeadlineColumn; readonly badge: string }) {
  const { finalist, value, unit, note, leads } = column;
  return (
    <div className={styles.column} data-hue={finalist.hue}>
      <div className={styles.identity}>
        <span className={styles.avatar} aria-hidden="true">
          {finalist.initials}
        </span>
        <span className={styles.nameBlock}>
          <span className={styles.name}>{finalist.name}</span>
          {leads && <span className={styles.badge}>{badge}</span>}
        </span>
      </div>
      <AnimatedNumber
        className={styles.value}
        value={value}
        format={unit === 'percent' ? formatPercent : formatCount}
      />
      <div className={styles.note}>{note}</div>
    </div>
  );
}
