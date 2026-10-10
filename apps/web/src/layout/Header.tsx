import type { ReactNode } from 'react';
import styles from './Layout.module.css';

interface Props {
  /** Status pill and, on wide screens, the round tabs. */
  readonly children?: ReactNode;
}

/** Brand mark: the flag's yellow rhombus and white globe on a green tile. */
export function Logo({ className }: { readonly className?: string | undefined }) {
  return (
    <svg className={className} viewBox="0 0 34 34" aria-hidden="true">
      <rect width="34" height="34" rx="9" fill="#00843d" />
      <polygon points="17,5 30,17 17,29 4,17" fill="#ffd60a" />
      <circle cx="17" cy="17" r="6" fill="#ffffff" />
    </svg>
  );
}

export function Header({ children }: Props) {
  return (
    <header className={styles.header}>
      <div className="flag-stripe" />
      <div className={styles.headerInner}>
        <div className={styles.brand}>
          <Logo className={styles.logo} />
          <div>
            <div className={styles.title}>Segundo Turno</div>
            <div className={styles.subtitle}>
              Eleição presidencial 2026
              <span className={styles.subtitleWide}> · apuração em tempo real</span>
            </div>
          </div>
        </div>
        {children && <div className={styles.headerActions}>{children}</div>}
      </div>
    </header>
  );
}
