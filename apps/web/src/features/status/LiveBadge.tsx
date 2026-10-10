import type { Round, Tally } from '@stb/domain';
import styles from './LiveBadge.module.css';

interface Props {
  readonly round: Round;
  readonly country: Tally;
}

function badgeText(round: Round, total: number, counted: number): string {
  if (round === 1) return 'Resultado final';
  if (counted === 0) return 'Aguardando apuração';
  return total > 0 && counted === total ? 'Apuração encerrada' : 'Ao vivo';
}

/** Pulses "Ao vivo" only while the runoff is actually being counted. */
export function LiveBadge({ round, country }: Props) {
  const { total, counted } = country.sections;
  const text = badgeText(round, total, counted);
  return (
    <span className={styles.badge} data-done={text !== 'Ao vivo' || undefined}>
      <span className={styles.dot} aria-hidden="true" />
      {text}
    </span>
  );
}
