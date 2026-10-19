import { REGION_CODES } from '@stb/domain';
import type { Messages } from '../../i18n/messages/pt-BR';
import { useI18n } from '../../i18n/i18n-context';
import type { MyPlace } from '../../lib/my-place';
import {
  ABROAD,
  COUNTRY,
  isSameSelection,
  parseSelectionPath,
  regionOf,
  type Selection,
} from '../../lib/selection';
import styles from './ScopeChips.module.css';

interface Props {
  readonly selection: Selection;
  readonly onSelect: (selection: Selection) => void;
  /** The viewer's pinned place, offered first. */
  readonly myPlace?: MyPlace | undefined;
}

const chipsOf = ({ places }: Messages): { label: string; target: Selection }[] => [
  { label: places.brazil, target: COUNTRY },
  ...REGION_CODES.map((code) => ({
    label: places.regions[code],
    target: { kind: 'region', code } as const,
  })),
  { label: places.abroad, target: ABROAD },
];

/**
 * Sticky bar with Brasil, the five regions and abroad. While a state is selected, its
 * region's chip stays marked as the parent of the selection; while a country abroad is,
 * the abroad chip does. A place the viewer pinned comes first, with a star.
 */
export function ScopeChips({ selection, onSelect, myPlace }: Props) {
  const { m, country } = useI18n();
  const parent = selection.kind === 'state' ? regionOf(selection) : undefined;
  const inAbroad = selection.kind === 'abroadCountry';
  const pinned = myPlace && parseSelectionPath(myPlace.path);
  return (
    <div className={styles.bar}>
      <div className={styles.chips} role="group" aria-label={m.myPlace.chips}>
        {myPlace && pinned && (
          <button
            type="button"
            className={styles.chip}
            aria-pressed={isSameSelection(selection, pinned)}
            data-state={isSameSelection(selection, pinned) ? 'exact' : undefined}
            onClick={() => onSelect(pinned)}
          >
            <span aria-hidden="true">★ </span>
            {pinned.kind === 'abroadCountry' ? country(myPlace.label) : myPlace.label}
          </button>
        )}
        {chipsOf(m).map(({ label, target }) => {
          const exact = isSameSelection(selection, target);
          const isParent =
            (target.kind === 'region' && target.code === parent) ||
            (target.kind === 'abroad' && inAbroad);
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
