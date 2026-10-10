import type { Round } from '@stb/domain';
import styles from './RoundTabs.module.css';

interface Props {
  readonly round: Round;
  readonly onChange: (round: Round) => void;
}

const TABS: { round: Round; label: string; date: string }[] = [
  { round: 2, label: '2º turno', date: '25 de outubro' },
  { round: 1, label: '1º turno', date: '4 de outubro' },
];

/** Switches between the live runoff and the final first-round results. */
export function RoundTabs({ round, onChange }: Props) {
  return (
    <div className={styles.tabs} role="tablist" aria-label="Turno da eleição">
      {TABS.map((tab) => (
        <button
          key={tab.round}
          type="button"
          role="tab"
          aria-selected={round === tab.round}
          className={styles.tab}
          onClick={() => onChange(tab.round)}
        >
          <span className={styles.label}>{tab.label}</span>
          <span className={styles.date}>{tab.date}</span>
        </button>
      ))}
    </div>
  );
}
