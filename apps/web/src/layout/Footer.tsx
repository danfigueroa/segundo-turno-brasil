import type { ReactNode } from 'react';
import styles from './Layout.module.css';

interface Props {
  /** When and where the data comes from. */
  readonly children?: ReactNode;
}

export function Footer({ children }: Props) {
  return (
    <footer className={styles.footer}>
      <div className={`flag-stripe ${styles.footerStripe}`} />
      {children}
      <p className={styles.disclaimer}>
        Site independente, sem vínculo com o TSE ou com candidatos.
      </p>
    </footer>
  );
}
