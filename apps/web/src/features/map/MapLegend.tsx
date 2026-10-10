import { MARGIN_BINS, type Finalist } from '../../lib/finalists';
import styles from './BrazilMap.module.css';

const STEPS = [1, 2, 3, 4, 5] as const;
const BIN_LABELS = [
  `<${MARGIN_BINS[0]}`,
  ...MARGIN_BINS.slice(1).map((limit, i) => `${MARGIN_BINS[i]}–${limit}`),
  `${MARGIN_BINS.at(-1)}+`,
];

/** Diverging legend: one arm per finalist, each step a margin bin in percentage points. */
export function MapLegend({ finalists }: { readonly finalists: readonly Finalist[] }) {
  return (
    <div className={styles.legend}>
      <div className={styles.legendTitle}>Vantagem de quem lidera (pontos percentuais)</div>
      <div className={styles.legendArms}>
        {finalists.map((f, index) => (
          <div key={f.number} className={styles.legendArm} data-hue={f.hue}>
            <div className={styles.legendName}>{f.name}</div>
            <div className={styles.legendSteps} data-reverse={index === 0 || undefined}>
              {STEPS.map((step) => (
                <div key={step} className={styles.legendCell}>
                  <span className={styles.legendStep} data-intensity={step} />
                  <span className={styles.legendBin}>{BIN_LABELS[step - 1]}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className={styles.legendEmpty}>
        <span className={styles.legendStep} data-intensity="0" /> Sem votos apurados ou empate
      </div>
    </div>
  );
}
