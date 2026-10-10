import { countedPercentage, type Tally } from '@stb/domain';
import { AnimatePresence, m } from 'motion/react';
import type { ReactNode } from 'react';
import { finalistResults, type Finalist } from '../../lib/finalists';
import { formatPercent } from '../../lib/format';
import styles from './StateSheet.module.css';

interface Props {
  readonly title: string | undefined;
  readonly tally: Tally | undefined;
  readonly finalists: readonly Finalist[];
  readonly onClose: () => void;
  /** Extra actions, e.g. sharing. */
  readonly children?: ReactNode;
}

/** Mobile bottom sheet with the tapped state's result, so the map stays in view. */
export function StateSheet({ title, tally, finalists, onClose, children }: Props) {
  return (
    <AnimatePresence>
      {title && tally && (
        <m.aside
          key={title}
          className={styles.sheet}
          aria-label={`Resultado em ${title}`}
          initial={{ y: '110%' }}
          animate={{ y: 0 }}
          exit={{ y: '110%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 36 }}
        >
          <div className={styles.header}>
            <strong>{title}</strong>
            <button type="button" className={styles.close} onClick={onClose} aria-label="Fechar">
              ×
            </button>
          </div>
          <div className={styles.rows}>
            {finalistResults(tally, finalists).map((r) => (
              <div key={r.number} className={styles.row} data-hue={r.hue}>
                <span className={styles.name}>{r.name}</span>
                <span className={styles.share}>{formatPercent(r.share)}</span>
                <span className={styles.bar} style={{ transform: `scaleX(${r.share / 100})` }} />
              </div>
            ))}
          </div>
          <div className={styles.meta}>{formatPercent(countedPercentage(tally))} apurado</div>
          {children && <div className={styles.actions}>{children}</div>}
        </m.aside>
      )}
    </AnimatePresence>
  );
}
