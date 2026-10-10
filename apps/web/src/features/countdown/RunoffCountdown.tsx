import { useEffect, useState } from 'react';
import type { Finalist } from '../../lib/finalists';
import { formatPercent } from '../../lib/format';
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
  const parts = countdownParts(RUNOFF_COUNT_START, useNow(1000));
  const zero = formatPercent(0);

  return (
    <>
      <section className={`card ${styles.card}`} aria-labelledby="countdown-title">
        <div className={styles.heading}>
          <div className={styles.eyebrow}>Domingo, 25 de outubro</div>
          <h1 id="countdown-title" className={styles.title}>
            A apuração começa às 17h
          </h1>
          <p className={styles.text}>
            Horário de Brasília, logo após o fechamento das urnas. Os números aparecem aqui assim
            que o TSE divulgar.
          </p>
        </div>

        <div className={styles.clock} role="timer" aria-label="Tempo até o início da apuração">
          {parts.map((part) => (
            <div key={part.unit} className={styles.tile}>
              <span className={styles.tileValue}>{part.value}</span>
              <span className={styles.tileUnit}>{part.unit}</span>
            </div>
          ))}
        </div>

        <div className={styles.finalists}>
          {finalists.map((f) => (
            <div key={f.number} className={styles.finalist} data-hue={f.hue}>
              <span className={styles.avatar} aria-hidden="true">
                {f.initials}
              </span>
              <span className={styles.finalistText}>
                <span className={styles.finalistName}>{f.name}</span>
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
            <span>{zero} das seções apuradas</span>
            <span>50% + 1 vence</span>
          </div>
        </div>
      </section>

      <button type="button" className={styles.cta} onClick={onShowFirstRound}>
        <span className={styles.ctaText}>
          <span className={styles.ctaKicker}>Enquanto isso</span>
          <span className={styles.ctaLabel}>Ver o resultado do 1º turno</span>
        </span>
        <svg className={styles.ctaIcon} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>
    </>
  );
}
