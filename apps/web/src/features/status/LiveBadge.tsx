import type { Round, Tally } from '@stb/domain';
import { useI18n } from '../../i18n/i18n-context';
import styles from './LiveBadge.module.css';

interface Props {
  readonly round: Round;
  readonly country: Tally;
}

type Status = 'final' | 'waiting' | 'live';

function statusOf(round: Round, total: number, counted: number): Status {
  if (round === 1 || (total > 0 && counted === total)) return 'final';
  return counted === 0 ? 'waiting' : 'live';
}

/** Status pill: a check when final, a pulsing dot while waiting or counting. */
export function LiveBadge({ round, country }: Props) {
  const { m } = useI18n();
  const { total, counted } = country.sections;
  const status = statusOf(round, total, counted);
  return (
    <span className={styles.badge} data-status={status}>
      {status === 'final' ? (
        <svg className={styles.check} viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2.5 6.2 5 8.5 9.5 3.5" />
        </svg>
      ) : (
        <span className={styles.dot} aria-hidden="true" />
      )}
      {round === 1 ? m.status.final : status === 'final' ? m.status.finished : m.status[status]}
    </span>
  );
}
