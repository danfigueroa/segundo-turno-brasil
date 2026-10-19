import type { ReactNode } from 'react';
import { useI18n } from '../i18n/i18n-context';
import styles from './Layout.module.css';

interface Props {
  /** When and where the data comes from. */
  readonly children?: ReactNode;
}

export function Footer({ children }: Props) {
  const { m } = useI18n();
  return (
    <footer className={styles.footer}>
      <div className={`flag-stripe ${styles.footerStripe}`} />
      <div className={styles.footerText}>
        {children}
        <p>
          {m.site.credit}{' '}
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
