import type { StateCode } from '@stb/domain';
import { useMemo } from 'react';
import { useI18n } from '../../i18n/i18n-context';
import { formatName } from '../../lib/format';
import type { Municipalities, Selection } from '../../lib/selection';
import mapStyles from '../map/BrazilMap.module.css';

interface Props {
  readonly uf: StateCode;
  readonly selection: Selection;
  /** Municipalities of the state; `undefined` while loading (the select is disabled). */
  readonly cities: Municipalities;
  readonly onSelect: (selection: Selection) => void;
  readonly label: string;
  readonly className?: string | undefined;
}

/** Native select with every municipality of the state, in alphabetical order. */
export function CitySelect({ uf, selection, cities, onSelect, label, className }: Props) {
  const { m, locale } = useI18n();
  // Sorted once per poll and language: hundreds of names (853 in Minas Gerais).
  const options = useMemo(() => {
    const { compare } = new Intl.Collator(locale);
    return (cities ?? [])
      .map((city) => ({ ibge: city.ibge, name: formatName(city.name) }))
      .sort((a, b) => compare(a.name, b.name));
  }, [cities, locale]);
  const value = selection.kind === 'city' ? selection.ibge : '';
  return (
    <div className={`${mapStyles.selectWrap} ${className ?? ''}`}>
      <label htmlFor="city-select" className={mapStyles.selectLabel}>
        {label}
      </label>
      <select
        id="city-select"
        className={mapStyles.selectInput}
        value={value}
        disabled={!cities}
        onChange={(event) => {
          const ibge = event.target.value;
          onSelect(ibge ? { kind: 'city', state: uf, ibge } : { kind: 'state', code: uf });
        }}
      >
        <option value="">{cities ? m.map.allCities : m.map.loadingCities}</option>
        {options.map((city) => (
          <option key={city.ibge} value={city.ibge}>
            {city.name}
          </option>
        ))}
      </select>
    </div>
  );
}
