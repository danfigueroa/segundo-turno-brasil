import { isSameSelection, parseSelectionPath, type Selection } from '../../lib/selection';
import { myPlaceNoun, myPlaceOf, type MyPlace } from '../../lib/my-place';
import styles from './PinButton.module.css';

interface Props {
  readonly selection: Selection;
  /** Name of the selection: "Salvador". */
  readonly label: string;
  readonly place: MyPlace | undefined;
  readonly onChange: (place: MyPlace | undefined) => void;
}

/** Pins the state, city or country on screen as the viewer's, for a shortcut in the chips. */
export function PinButton({ selection, label, place, onChange }: Props) {
  const pinned = place !== undefined && isSameSelection(parseSelectionPath(place.path), selection);
  const noun = myPlaceNoun(selection);
  return (
    <button
      type="button"
      className={styles.pin}
      aria-pressed={pinned}
      onClick={() => onChange(pinned ? undefined : myPlaceOf(selection, label))}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8Z"
          fill={pinned ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
      {pinned ? `Fixado como ${noun}` : `Fixar como ${noun}`}
    </button>
  );
}
