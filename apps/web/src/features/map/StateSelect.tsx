import { STATE_CODES, STATES, isStateCode } from '@stb/domain';
import { ABROAD, COUNTRY, stateOf, type Selection } from '../../lib/selection';
import styles from './BrazilMap.module.css';

interface Props {
  readonly selection: Selection;
  readonly onSelect: (selection: Selection) => void;
  readonly label: string;
  readonly className?: string | undefined;
}

const SORTED_STATES = STATE_CODES.toSorted((a, b) => STATES[a].name.localeCompare(STATES[b].name));
const ABROAD_VALUE = 'EX';

/** Native select with every state and abroad: the quickest picker on a phone. */
export function StateSelect({ selection, onSelect, label, className }: Props) {
  const value = stateOf(selection) ?? (selection.kind === 'abroad' ? ABROAD_VALUE : '');
  return (
    <div className={`${styles.selectWrap} ${className ?? ''}`}>
      <label htmlFor="state-select" className={styles.selectLabel}>
        {label}
      </label>
      <select
        id="state-select"
        className={styles.selectInput}
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          if (next === ABROAD_VALUE) onSelect(ABROAD);
          else if (isStateCode(next)) onSelect({ kind: 'state', code: next });
          else onSelect(COUNTRY);
        }}
      >
        <option value="">Todos os estados</option>
        {SORTED_STATES.map((code) => (
          <option key={code} value={code}>
            {STATES[code].name}
          </option>
        ))}
        <option value={ABROAD_VALUE}>Exterior</option>
      </select>
    </div>
  );
}
