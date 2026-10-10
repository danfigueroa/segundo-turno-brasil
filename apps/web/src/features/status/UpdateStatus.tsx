import type { ResultsResponse } from '@stb/contracts';
import { formatDate, formatTime } from '../../lib/format';
import styles from './UpdateStatus.module.css';

interface Props {
  readonly data: ResultsResponse;
}

/** Warns, politely, when the TSE is unreachable and an older snapshot is on screen. */
export function StaleWarning({ data }: Props) {
  return (
    <div role="status" aria-live="polite">
      {data.stale && (
        <p className={styles.warning}>
          O TSE não respondeu agora. Mostrando os dados de {formatTime(data.fetchedAt)}.
        </p>
      )}
    </div>
  );
}

/** When the data was last totalized, for the footer. */
export function UpdateNote({ data }: Props) {
  const { updatedAt } = data.country;
  return (
    <p>
      {data.round === 1
        ? `Resultado final, totalizado em ${formatDate(updatedAt)} às ${formatTime(updatedAt)}`
        : `Atualizado às ${formatTime(updatedAt)}`}{' '}
      (horário de Brasília) · Fonte: TSE
    </p>
  );
}
