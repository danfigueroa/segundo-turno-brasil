import { REGION_CODES, REGION_NAMES } from '@stb/domain';
import { ABROAD, COUNTRY, isSameSelection, regionOf, type Selection } from '../../lib/selection';
import styles from './ScopeChips.module.css';

interface Props {
  readonly selection: Selection;
  readonly onSelect: (selection: Selection) => void;
}

const CHIPS: { label: string; target: Selection }[] = [
  { label: 'Brasil', target: COUNTRY },
  ...REGION_CODES.map((code) => ({
    label: REGION_NAMES[code],
    target: { kind: 'region', code } as const,
  })),
  { label: 'Exterior', target: ABROAD },
];

/**
 * Sticky bar with Brasil, the five regions and abroad. While a state is selected, its
 * region's chip stays marked as the parent of the selection.
 */
export function ScopeChips({ selection, onSelect }: Props) {
  const parent = selection.kind === 'state' ? regionOf(selection) : undefined;
  return (
    <div className={styles.bar}>
      <div className={styles.chips} role="group" aria-label="Ver resultado de">
        {CHIPS.map(({ label, target }) => {
          const exact = isSameSelection(selection, target);
          const isParent = target.kind === 'region' && target.code === parent;
          return (
            <button
              key={label}
              type="button"
              className={styles.chip}
              aria-pressed={exact || isParent}
              data-state={exact ? 'exact' : isParent ? 'parent' : undefined}
              onClick={() => onSelect(target)}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
