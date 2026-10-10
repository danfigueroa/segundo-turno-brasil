import { REGION_CODES, REGION_NAMES, STATE_CODES, STATES, type StateCode } from '@stb/domain';
import { ABROAD, COUNTRY, isSameSelection, type Selection } from '../../lib/selection';
import styles from './ScopePicker.module.css';

interface Props {
  readonly selection: Selection;
  readonly onSelect: (selection: Selection) => void;
}

const SORTED_STATES = STATE_CODES.toSorted((a, b) => STATES[a].name.localeCompare(STATES[b].name));

/** Brasil / regions / abroad as chips, states as a native select (best picker on mobile). */
export function ScopePicker({ selection, onSelect }: Props) {
  const chips: { label: string; target: Selection }[] = [
    { label: 'Brasil', target: COUNTRY },
    ...REGION_CODES.map((code) => ({
      label: REGION_NAMES[code],
      target: { kind: 'region', code } as const,
    })),
    { label: 'Exterior', target: ABROAD },
  ];

  return (
    <nav className={styles.picker} aria-label="Escolher abrangência">
      <div className={styles.chips}>
        {chips.map(({ label, target }) => (
          <button
            key={label}
            type="button"
            className={styles.chip}
            aria-pressed={isSameSelection(selection, target)}
            onClick={() => onSelect(target)}
          >
            {label}
          </button>
        ))}
      </div>
      <label className={styles.selectWrap}>
        <span className="visually-hidden">Estado</span>
        <select
          className={styles.select}
          value={selection.kind === 'state' ? selection.code : ''}
          onChange={(event) =>
            onSelect(
              event.target.value
                ? { kind: 'state', code: event.target.value as StateCode }
                : COUNTRY,
            )
          }
        >
          <option value="">Escolha um estado</option>
          {SORTED_STATES.map((code) => (
            <option key={code} value={code}>
              {STATES[code].name}
            </option>
          ))}
        </select>
      </label>
    </nav>
  );
}
