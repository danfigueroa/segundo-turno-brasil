import type { Round } from '@stb/domain';
import { useI18n } from '../../i18n/i18n-context';
import styles from './RoundTabs.module.css';

interface Props {
  readonly round: Round;
  readonly onChange: (round: Round) => void;
  /** Single-line tabs with short dates, for the desktop header. */
  readonly compact?: boolean;
}

/** Election days, at noon in Brasília. */
const TABS: { round: Round; day: string }[] = [
  { round: 2, day: '2026-10-25T12:00:00-03:00' },
  { round: 1, day: '2026-10-04T12:00:00-03:00' },
];

/** Switches between the live runoff and the final first-round results. */
export function RoundTabs({ round, onChange, compact = false }: Props) {
  const { m, f } = useI18n();
  return (
    <div
      className={styles.tabs}
      data-compact={compact || undefined}
      role="tablist"
      aria-label={m.round.tabs}
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
          <span className={styles.label}>{m.round.labels[tab.round]}</span>
          <span className={styles.date}>{compact ? f.date(tab.day) : f.dayMonth(tab.day)}</span>
        </button>
      ))}
    </div>
  );
}
