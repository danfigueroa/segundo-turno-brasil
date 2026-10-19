import { STATES, type StateCode } from '@stb/domain';
import { useI18n } from '../../i18n/i18n-context';
import { leadOfVotes, type Finalist } from '../../lib/finalists';
import { formatName } from '../../lib/format';
import { useMediaQuery } from '../../lib/use-media-query';
import type { Municipalities, Selection } from '../../lib/selection';
import mapStyles from '../map/BrazilMap.module.css';
import { MapLegend } from '../map/MapLegend';
import { StateSelect } from '../map/StateSelect';
import { cityLabel } from './city-label';
import { CitySelect } from './CitySelect';
import type { StateMapShape } from './state-maps';
import styles from './StateMap.module.css';

interface Props {
  readonly uf: StateCode;
  /** The state's municipal map; `undefined` while loading. */
  readonly map: StateMapShape | undefined;
  readonly selection: Selection;
  /** Municipalities of the state; `undefined` while loading (drawn gray). */
  readonly cities: Municipalities;
  readonly finalists: readonly Finalist[];
  readonly onSelect: (selection: Selection) => void;
}

/** Font size of the selected city's name, in viewBox units (the maps are ~1000 wide). */
const LABEL_SIZE = { phone: 46, wide: 30 };

/**
 * The selected state's municipalities, each in the color of its leader (same margins and
 * legend as the states). Tapping one selects it; the list of cities below is the
 * keyboard and screen reader path, as hundreds of shapes cannot all take focus. The
 * selected city is named on the map, and the selects jump to another state or city.
 */
export default function StateMap({ uf, map, selection, cities, finalists, onSelect }: Props) {
  const { m } = useI18n();
  const wide = useMediaQuery('(min-width: 960px)');
  const byIbge = new Map(cities?.map((c) => [c.ibge, c]));
  const leads = new Map(cities?.map((c) => [c.ibge, leadOfVotes(c.votes, finalists)]));
  const anyLead = [...leads.values()].some(Boolean);
  const selectedIbge = selection.kind === 'city' ? selection.ibge : undefined;
  const shapes = Object.entries(map?.cities ?? {});
  // The selected municipality goes last so its outline is drawn on top of its neighbors.
  shapes.sort(([a], [b]) => Number(a === selectedIbge) - Number(b === selectedIbge));
  const selectedCity = selectedIbge ? byIbge.get(selectedIbge) : undefined;
  const selectedShape = selectedIbge ? map?.cities[selectedIbge] : undefined;
  const fontSize = wide ? LABEL_SIZE.wide : LABEL_SIZE.phone;
  const label =
    map && selectedCity && selectedShape
      ? cityLabel(selectedShape, map.viewBox, fontSize)
      : undefined;

  return (
    <section className={`card ${mapStyles.card} ${styles.layout}`} aria-labelledby="map-title">
      <div className={mapStyles.head}>
        <h2 id="map-title" className={mapStyles.title}>
          {m.map.leadByCity}
        </h2>
        <p className={mapStyles.subtitle}>
          {!anyLead ? m.map.citiesFill(STATES[uf].name) : wide ? m.map.clickCity : m.map.tapCity}
        </p>
      </div>

      <div className={mapStyles.container}>
        {map ? (
          <svg
            className={mapStyles.map}
            viewBox={map.viewBox}
            role="img"
            aria-label={m.map.citiesOf(STATES[uf].name)}
          >
            {shapes.map(([ibge, d]) => {
              const lead = leads.get(ibge);
              const known = byIbge.has(ibge);
              return (
                <path
                  key={ibge}
                  d={d}
                  className={`${mapStyles.state} ${styles.city}`}
                  data-hue={lead?.hue ?? 'none'}
                  data-intensity={lead?.intensity ?? 0}
                  data-selected={ibge === selectedIbge || undefined}
                  onClick={known ? () => onSelect({ kind: 'city', state: uf, ibge }) : undefined}
                />
              );
            })}
            {label && selectedCity && (
              <text
                className={styles.cityLabel}
                x={label.x}
                y={label.y}
                fontSize={fontSize}
                dominantBaseline={label.side === 'above' ? 'auto' : 'hanging'}
                aria-hidden="true"
              >
                {formatName(selectedCity.name)}
              </text>
            )}
          </svg>
        ) : (
          <div className={styles.placeholder} aria-hidden="true" />
        )}
      </div>

      <div className={`${mapStyles.select} ${styles.selects}`}>
        <StateSelect
          label={wide ? m.map.goToState : m.map.pickState}
          selection={selection}
          onSelect={onSelect}
        />
        <CitySelect
          uf={uf}
          label={wide ? m.map.goToCity : m.map.pickCity}
          selection={selection}
          cities={cities}
          onSelect={onSelect}
        />
      </div>
      <MapLegend
        className={mapStyles.legend}
        finalists={anyLead ? finalists : []}
        showEmpty={!anyLead || [...leads.values()].some((lead) => !lead)}
      />
    </section>
  );
}
