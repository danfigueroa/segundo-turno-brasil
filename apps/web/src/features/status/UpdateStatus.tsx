import type { ResultsResponse } from '@stb/contracts';
import { useI18n } from '../../i18n/i18n-context';
import styles from './UpdateStatus.module.css';

interface Props {
  readonly data: ResultsResponse;
}

/** Warns, politely, when the TSE is unreachable and an older snapshot is on screen. */
export function StaleWarning({ data }: Props) {
  const { m, f } = useI18n();
  return (
    <div role="status" aria-live="polite">
      {data.stale && <p className={styles.warning}>{m.status.stale(f.time(data.fetchedAt))}</p>}
    </div>
  );
}

/** When the data was last totalized, for the footer. */
export function UpdateNote({ data }: Props) {
  const { m, f } = useI18n();
  const { updatedAt } = data.country;
  return (
    <p>
      {data.round === 1
        ? m.status.finalAt(f.date(updatedAt), f.time(updatedAt))
        : m.status.updatedAt(f.time(updatedAt))}{' '}
      {m.status.source}
    </p>
  );
}
