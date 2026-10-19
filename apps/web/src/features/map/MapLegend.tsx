import { ABSTENTION_BINS } from '../../lib/abstention';
import { MARGIN_BINS, type Finalist } from '../../lib/finalists';
import { useI18n } from '../../i18n/i18n-context';
import styles from './BrazilMap.module.css';

const STEPS = [1, 2, 3, 4, 5] as const;
/** `<2`, `2–5`, …, `20+` from the bin limits. */
const binLabels = (bins: readonly number[]) => [
  `<${bins[0]}`,
  ...bins.slice(1).map((limit, i) => `${bins[i]}–${limit}`),
  `${bins.at(-1)}+`,
];
const BIN_LABELS = binLabels(MARGIN_BINS);
const ABSTENTION_LABELS = binLabels(ABSTENTION_BINS);

interface Props {
  /** One row per finalist; empty before any vote is counted. */
  readonly finalists: readonly Finalist[];
  /** Whether some area has no votes yet (or a tie) and is drawn gray. */
  readonly showEmpty: boolean;
  readonly className?: string | undefined;
}

/** One row of five margin bins per finalist, in percentage points. */
export function MapLegend({ finalists, showEmpty, className }: Props) {
  const { m } = useI18n();
  return (
    <div className={`${styles.legendBox} ${className ?? ''}`}>
      {finalists.length > 0 && (
        <>
          <div className={styles.legendTitle}>{m.map.legendLead}</div>
          <div className={styles.legendGrid}>
            {finalists.map((f) => (
              <div key={f.number} className={styles.legendRow} data-hue={f.hue}>
                <span className={styles.legendName}>{f.name}</span>
                {STEPS.map((step) => (
                  <span key={step} className={styles.legendStep} data-intensity={step} />
                ))}
              </div>
            ))}
            <div className={styles.legendRow} aria-hidden="true">
              <span />
              {BIN_LABELS.map((label) => (
                <span key={label} className={styles.legendBin}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
      {showEmpty && (
        <div className={styles.legendEmpty}>
          <span className={styles.legendStep} data-intensity="0" />
          {finalists.length > 0 ? m.map.noVotesOrTie : m.common.noVotes}
        </div>
      )}
    </div>
  );
}

/** Five abstention bins on the neutral ramp, for the abstention map. */
export function AbstentionLegend({ className }: { readonly className?: string | undefined }) {
  const { m } = useI18n();
  return (
    <div className={`${styles.legendBox} ${className ?? ''}`}>
      <div className={styles.legendTitle}>{m.map.legendAbstention}</div>
      <div className={styles.legendGrid}>
        <div className={styles.legendRow} data-hue="abstention">
          <span className={styles.legendName}>{m.map.abstention}</span>
          {STEPS.map((step) => (
            <span key={step} className={styles.legendStep} data-intensity={step} />
          ))}
        </div>
        <div className={styles.legendRow} aria-hidden="true">
          <span />
          {ABSTENTION_LABELS.map((label) => (
            <span key={label} className={styles.legendBin}>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
