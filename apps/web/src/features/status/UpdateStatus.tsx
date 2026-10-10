import type { ResultsResponse } from '@stb/contracts';
import { formatDate, formatTime } from '../../lib/format';
import styles from './UpdateStatus.module.css';

interface Props {
  readonly data: ResultsResponse;
  /** Offered while the runoff has not started, so the page is never a dead end. */
  readonly onShowFirstRound?: () => void;
}

/** When the data was last totalized, and whether we are serving an older snapshot. */
export function UpdateStatus({ data, onShowFirstRound }: Props) {
  const counting = data.country.sections.counted > 0;
  const { updatedAt } = data.country;
  return (
    <div className={styles.status} role="status" aria-live="polite">
      {data.stale && (
        <p className={styles.warning}>
          O TSE não respondeu agora. Mostrando os dados de {formatTime(data.fetchedAt)}.
        </p>
      )}
      {data.round === 2 && !counting && (
        <p className={styles.waiting}>
          A apuração do 2º turno começa após o fechamento das urnas, em 25/10 às 17h (horário de
          Brasília).
          {onShowFirstRound && (
            <button type="button" className={styles.link} onClick={onShowFirstRound}>
              Ver o resultado do 1º turno
            </button>
          )}
        </p>
      )}
      <p className={styles.meta}>
        {data.round === 1
          ? `Resultado final, totalizado em ${formatDate(updatedAt)} às ${formatTime(updatedAt)}`
          : `Atualizado às ${formatTime(updatedAt)}`}{' '}
        (horário de Brasília) · Fonte: TSE
      </p>
    </div>
  );
}
