import type { Round } from '@stb/domain';
import type { ReactNode } from 'react';
import styles from './Layout.module.css';

const SUBTITLES: Readonly<Record<Round, string>> = {
  1: 'Presidente da República · 1º turno, 4 de outubro',
  2: 'Apuração para Presidente da República · 25 de outubro',
};

interface Props {
  readonly round?: Round | undefined;
  readonly children?: ReactNode;
}

export function Header({ round = 2, children }: Props) {
  return (
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>Segundo Turno 2026</h1>
        <p className={styles.subtitle}>{SUBTITLES[round]}</p>
      </div>
      {children}
    </header>
  );
}
