import type { Round } from '@stb/domain';
import styles from './RoundTabs.module.css';

interface Props {
  readonly round: Round;
  readonly onChange: (round: Round) => void;
  /** Single-line tabs with short dates, for the desktop header. */
  readonly compact?: boolean;
}

const TABS: { round: Round; label: string; date: string; shortDate: string }[] = [
  { round: 2, label: '2º turno', date: '25 de outubro', shortDate: '25/10' },
  { round: 1, label: '1º turno', date: '4 de outubro', shortDate: '04/10' },
];

/** Switches between the live runoff and the final first-round results. */
export function RoundTabs({ round, onChange, compact = false }: Props) {
  return (
    <div
      className={styles.tabs}
      data-compact={compact || undefined}
      role="tablist"
      aria-label="Turno da eleição"
    >
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
          <span className={styles.date}>{compact ? tab.shortDate : tab.date}</span>
        </button>
      ))}
    </div>
  );
}
