import type { ResultsResponse } from '@stb/contracts';
import { formatTime } from '../../lib/format';
import styles from './UpdateStatus.module.css';

/** When the data was last totalized, and whether we are serving an older snapshot. */
export function UpdateStatus({ data }: { readonly data: ResultsResponse }) {
  const counting = data.country.sections.counted > 0;
  return (
    <div className={styles.status} role="status" aria-live="polite">
      {data.stale && (
        <p className={styles.warning}>
          O TSE não respondeu agora. Mostrando os dados de {formatTime(data.fetchedAt)}.
        </p>
      )}
      {!counting && (
        <p className={styles.waiting}>
          A apuração começa após o fechamento das urnas, às 17h (horário de Brasília).
        </p>
      )}
      <p className={styles.meta}>
        Atualizado às {formatTime(data.country.updatedAt)} (horário de Brasília) · Fonte: TSE
      </p>
    </div>
  );
}
