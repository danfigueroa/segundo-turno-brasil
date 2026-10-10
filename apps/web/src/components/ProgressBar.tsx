import styles from './ProgressBar.module.css';

interface Props {
  /** 0–100. */
  readonly value: number;
  readonly label: string;
}

export function ProgressBar({ value, label }: Props) {
  return (
    <div
      className={styles.track}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100) / 100}
    >
      <div className={styles.fill} style={{ transform: `scaleX(${value / 100})` }} />
    </div>
  );
}
