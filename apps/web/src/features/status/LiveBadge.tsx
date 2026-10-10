import type { Tally } from '@stb/domain';
import styles from './LiveBadge.module.css';

/** "Ao vivo" while counting, "Final" when every section is counted. */
export function LiveBadge({ country }: { readonly country: Tally }) {
  const { total, counted } = country.sections;
  const done = total > 0 && counted === total;
  return (
    <span className={styles.badge} data-done={done || undefined}>
      <span className={styles.dot} aria-hidden="true" />
      {done ? 'Apuração encerrada' : 'Ao vivo'}
    </span>
  );
}
