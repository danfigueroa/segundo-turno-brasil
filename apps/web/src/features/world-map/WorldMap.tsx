import type { AbroadResponse } from '@stb/contracts';
import { CONTINENT_CODES, type ContinentCode } from '@stb/domain';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useI18n } from '../../i18n/i18n-context';
import { leadOfVotes, type Finalist } from '../../lib/finalists';
import { abroadCountry, countryOf, COUNTRY, type Selection } from '../../lib/selection';
import { useMediaQuery } from '../../lib/use-media-query';
import filterStyles from '../countries/CountriesList.module.css';
import mapStyles from '../map/BrazilMap.module.css';
import { MapLegend } from '../map/MapLegend';
import { loadContinentMap } from './continent-maps';
import { countryLabels } from './country-labels';
import styles from './WorldMap.module.css';

interface Props {
  /** Votes abroad by country; `undefined` while loading (the countries are drawn gray). */
  readonly abroad: AbroadResponse | undefined;
  readonly finalists: readonly Finalist[];
  /** Abroad, or one of its countries (outlined, and its continent on screen). */
  readonly selection: Selection;
  readonly onSelect: (selection: Selection) => void;
}

/** Europe has the most Brazilian voters abroad (412 thousand in 2026): it opens first. */
const FIRST_CONTINENT: ContinentCode = 'EU';
/** Width of every continent map, in viewBox units. */
const MAP_WIDTH = 1000;
/** Font size of the names, in viewBox units. */
const LABEL_SIZE = { phone: 34, wide: 22 };
/** How many countries get a name. */
const LABELS = { phone: 5, wide: 8 };
/** Radius of the marker of a country too small to see, in viewBox units. */
const MARKER_RADIUS = 9;

/**
 * Votes abroad on a map of one continent at a time, so every country is big enough to
 * see: each country with polling stations in the color of its leader (same margins and
 * legend as the states), the others in a lighter gray. Tapping a country selects it, like
 * a state; the list by country below is the keyboard and screen reader path.
 */
export default function WorldMap({ abroad, finalists, selection, onSelect }: Props) {
  const { m, country: countryName } = useI18n();
  const wide = useMediaQuery('(min-width: 960px)');
  const [continent, setContinent] = useState<ContinentCode>(FIRST_CONTINENT);
  // A country picked anywhere (list, link, map) brings its continent on screen.
  const selected = countryOf(selection, abroad?.countries);
  const [followed, setFollowed] = useState<string | undefined>();
  if (selected && selected.name !== followed) {
    setFollowed(selected.name);
    setContinent(selected.continent);
  }
  const map = useQuery({
    queryKey: ['continent-map', continent],
    queryFn: () => loadContinentMap(continent),
    staleTime: Infinity,
  });

  const byName = new Map(abroad?.countries.map((c) => [c.name, c]));
  const leads = new Map(abroad?.countries.map((c) => [c.name, leadOfVotes(c.votes, finalists)]));
  const ofContinent = abroad?.countries.filter((c) => c.continent === continent) ?? [];
  const anyLead = ofContinent.some((c) => leads.get(c.name));
  const anyWithoutLead = ofContinent.some((c) => !leads.get(c.name));

  const shapes = (map.data?.countries ?? []).toSorted(
    // The selected country goes last so its outline is drawn on top of its neighbors.
    (a, b) => Number(a.name === selected?.name) - Number(b.name === selected?.name),
  );
  const fontSize = wide ? LABEL_SIZE.wide : LABEL_SIZE.phone;
  // Names and markers only for this continent: a neighbor's edge may show (Morocco in Europe).
  const own = shapes.flatMap((shape) => {
    const country = shape.name ? byName.get(shape.name) : undefined;
    const [x = 0, y = 0] = shape.label ?? [];
    return country?.continent === continent ? [{ shape, country, x, y }] : [];
  });
  const labels = countryLabels(
    own.map(({ country, x, y }) => ({
      name: countryName(country.name),
      x,
      y,
      weight: country.sections.total,
    })),
    { count: wide ? LABELS.wide : LABELS.phone, fontSize, width: MAP_WIDTH },
  );
  const brazil = shapes.find((shape) => shape.brazil);

  const summary = finalists
    .map((f) => {
      const count = ofContinent.filter((c) => leads.get(c.name)?.leader.number === f.number).length;
      return m.map.leadsInCountries(f.name, count);
    })
    .join(', ');

  return (
    <section className={`card ${mapStyles.card} ${styles.layout}`} aria-labelledby="map-title">
      <div className={mapStyles.head}>
        <h2 id="map-title" className={mapStyles.title}>
          {m.map.leadByCountry}
        </h2>
        <p className={mapStyles.subtitle}>
          {!anyLead ? m.map.countriesFill : wide ? m.map.clickCountry : m.map.tapCountry}
        </p>
      </div>

      <div
        className={`${filterStyles.filters} ${styles.continents}`}
        role="group"
        aria-label={m.map.continents}
      >
        {CONTINENT_CODES.map((code) => (
          <button
            key={code}
            type="button"
            className={filterStyles.filter}
            aria-pressed={continent === code}
            onClick={() => setContinent(code)}
          >
            {m.places.continents[code]}
          </button>
        ))}
      </div>

      <div className={styles.container}>
        {map.data ? (
          <svg
            className={styles.map}
            viewBox={map.data.viewBox}
            role="img"
            aria-label={
              anyLead
                ? `${m.places.continents[continent]}: ${summary}.`
                : m.map.mapOf(m.places.continents[continent])
            }
          >
            {shapes.map((shape, index) => {
              const country = shape.name ? byName.get(shape.name) : undefined;
              const lead = country && leads.get(country.name);
              return (
                <path
                  key={shape.name ?? index}
                  d={shape.d}
                  className={`${mapStyles.state} ${styles.country}`}
                  data-hue={lead?.hue ?? 'none'}
                  data-intensity={lead?.intensity ?? 0}
                  data-kind={shape.brazil ? 'brazil' : shape.name ? undefined : 'other'}
                  data-selected={(country && country === selected) || undefined}
                  onClick={country ? () => onSelect(abroadCountry(country.name)) : undefined}
                />
              );
            })}
            {own
              .filter(({ shape }) => shape.tiny)
              .map(({ country, x, y }) => {
                const lead = leads.get(country.name);
                return (
                  <circle
                    key={country.name}
                    cx={x}
                    cy={y}
                    r={MARKER_RADIUS}
                    className={`${mapStyles.state} ${styles.country}`}
                    data-hue={lead?.hue ?? 'none'}
                    data-intensity={lead?.intensity ?? 0}
                    data-selected={country === selected || undefined}
                    onClick={() => onSelect(abroadCountry(country.name))}
                  />
                );
              })}
            {brazil?.label && (
              <text
                x={brazil.label[0]}
                y={brazil.label[1]}
                fontSize={fontSize}
                className={styles.label}
                aria-hidden="true"
              >
                {m.places.brazil}
              </text>
            )}
            {labels.map((label) => (
              <text
                key={label.name}
                x={label.x}
                y={label.y}
                fontSize={fontSize}
                className={styles.label}
                aria-hidden="true"
              >
                {label.name}
              </text>
            ))}
          </svg>
        ) : (
          <div className={styles.placeholder} aria-hidden="true" />
        )}
      </div>

      <button type="button" className={styles.back} onClick={() => onSelect(COUNTRY)}>
        {m.map.backToBrazil}
      </button>
      <MapLegend
        className={mapStyles.legend}
        finalists={anyLead ? finalists : []}
        showEmpty={anyWithoutLead}
      />
    </section>
  );
}
