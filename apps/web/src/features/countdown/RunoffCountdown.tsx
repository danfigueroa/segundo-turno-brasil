import { useEffect, useState } from 'react';
import { CandidateAvatar } from '../../components/CandidateAvatar';
import { useI18n } from '../../i18n/i18n-context';
import type { Finalist } from '../../lib/finalists';
import { countdownParts, RUNOFF_COUNT_START } from './countdown';
import styles from './RunoffCountdown.module.css';

interface Props {
  readonly finalists: readonly Finalist[];
  readonly onShowFirstRound: () => void;
}

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

/** Before the runoff count: when it starts, who is running, and a way to the first round. */
export function RunoffCountdown({ finalists, onShowFirstRound }: Props) {
  const { m, f } = useI18n();
  const parts = countdownParts(RUNOFF_COUNT_START, useNow(1000));
  const zero = f.percent(0);

  return (
    <>
      <section className={`card ${styles.card}`} aria-labelledby="countdown-title">
        <div className={styles.heading}>
          <div className={styles.eyebrow}>{m.countdown.day}</div>
          <h1 id="countdown-title" className={styles.title}>
            {m.countdown.title}
          </h1>
          <p className={styles.text}>{m.countdown.text}</p>
        </div>

        <div className={styles.clock} role="timer" aria-label={m.countdown.timer}>
          {parts.map((part) => (
            <div key={part.unit} className={styles.tile}>
              <span className={styles.tileValue}>{part.value}</span>
              <span className={styles.tileUnit}>{m.countdown.units[part.unit]}</span>
            </div>
          ))}
        </div>

        <div className={styles.finalists}>
          {finalists.map((finalist) => (
            <div key={finalist.number} className={styles.finalist} data-hue={finalist.hue}>
              <CandidateAvatar finalist={finalist} className={styles.avatar} />
              <span className={styles.finalistText}>
                <span className={styles.finalistName}>{finalist.name}</span>
                <span className={styles.finalistShare}>{zero}</span>
              </span>
            </div>
          ))}
        </div>

        <div className={styles.barBlock}>
          <div className={styles.barTrack} aria-hidden="true">
            <div className={styles.bar} />
            <div className={styles.half} />
          </div>
          <div className={styles.barLabels}>
            <span>{m.common.sectionsCounted(zero)}</span>
            <span>{m.countdown.wins}</span>
          </div>
        </div>
      </section>

      <button type="button" className={styles.cta} onClick={onShowFirstRound}>
        <span className={styles.ctaText}>
          <span className={styles.ctaKicker}>{m.countdown.meanwhile}</span>
          <span className={styles.ctaLabel}>{m.countdown.firstRound}</span>
        </span>
        <svg className={styles.ctaIcon} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>
    </>
  );
}
