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
      <div className={styles.footerText}>
        {children}
        <p>
          Desenvolvido por{' '}
          <a
            className={styles.credit}
            href="https://www.instagram.com/danmfigueroa/"
            target="_blank"
            rel="noopener noreferrer"
          >
            @danmfigueroa
          </a>
        </p>
      </div>
    </footer>
  );
}
