import type { ReactNode } from 'react';
import styles from './Layout.module.css';

export function Header({ children }: { readonly children?: ReactNode }) {
  return (
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>Segundo Turno 2026</h1>
        <p className={styles.subtitle}>Apuração para Presidente da República · 25 de outubro</p>
      </div>
      {children}
    </header>
  );
}
