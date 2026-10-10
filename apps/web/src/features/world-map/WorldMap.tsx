import type { AbroadResponse } from '@stb/contracts';
import { useMemo } from 'react';
import type { Finalist } from '../../lib/finalists';
import { COUNTRY, type Selection } from '../../lib/selection';
import mapStyles from '../map/BrazilMap.module.css';
import { MapLegend } from '../map/MapLegend';
import { cityDots, labeledDots } from './city-dots';
import { WORLD_MAP } from './world-map';
import styles from './WorldMap.module.css';

interface Props {
  /** Votes abroad by city; `undefined` while loading (the land is drawn alone). */
  readonly abroad: AbroadResponse | undefined;
  readonly finalists: readonly Finalist[];
  readonly onSelect: (selection: Selection) => void;
}

/** How many of the biggest cities get a name on the map. */
const LABELS = 6;
/** Beyond this x (of 1000), a label would run off the map. */
const FLIP_LABEL_X = 820;

/**
 * Votes abroad on a world map: a dot per city with polling stations, sized by its
 * electorate and colored like the states. The dots are a picture; the list by country
 * below is the accessible way through the numbers.
 */
export default function WorldMap({ abroad, finalists, onSelect }: Props) {
  const dots = useMemo(
    () => (abroad ? cityDots(abroad.cities, finalists, WORLD_MAP.projection) : []),
    [abroad, finalists],
  );
  const labels = labeledDots(dots, LABELS);
  const anyLead = dots.some((d) => d.lead);
  const anyWithoutLead = dots.some((d) => !d.lead);
  const [brazilX = 0, brazilY = 0] = WORLD_MAP.brazil.label;

  const summary = finalists
    .map((f) => {
      const cities = dots.filter((d) => d.lead?.leader.number === f.number).length;
      return `${f.name} lidera em ${cities === 1 ? '1 cidade' : `${cities} cidades`}`;
    })
    .join(', ');

  return (
    <section className={`card ${mapStyles.card}`} aria-labelledby="map-title">
      <div className={mapStyles.head}>
        <h2 id="map-title" className={mapStyles.title}>
          Quem lidera em cada cidade
        </h2>
        <p className={mapStyles.subtitle}>
          {!anyLead
            ? 'As cidades com seção eleitoral ganham cor conforme as urnas são apuradas.'
            : 'Cada ponto é uma cidade com seção eleitoral, do tamanho do seu eleitorado.'}
        </p>
      </div>

      <div className={styles.container}>
        <svg className={styles.map} viewBox={WORLD_MAP.viewBox} role="group" aria-label="Mundo">
          <path d={WORLD_MAP.land} className={styles.land} aria-hidden="true" />
          <path d={WORLD_MAP.brazil.d} className={styles.brazil} aria-hidden="true" />
          <text x={brazilX} y={brazilY} className={styles.brazilLabel} aria-hidden="true">
            Brasil
          </text>
          <g
            role="img"
            aria-label={anyLead ? `Cidades no exterior: ${summary}.` : 'Cidades no exterior'}
          >
            {dots.map((dot) => (
              <circle
                key={dot.code}
                cx={dot.x}
                cy={dot.y}
                r={dot.r}
                className={`${mapStyles.state} ${styles.dot}`}
                data-hue={dot.lead?.hue ?? 'none'}
                data-intensity={dot.lead?.intensity ?? 0}
              />
            ))}
          </g>
          {labels.map((dot) => {
            // Names near the right edge go on the left of their dot, inside the map.
            const flip = dot.x > FLIP_LABEL_X;
            return (
              <text
                key={dot.code}
                x={flip ? dot.x - dot.r - 4 : dot.x + dot.r + 4}
                y={dot.y}
                textAnchor={flip ? 'end' : 'start'}
                className={styles.cityLabel}
                aria-hidden="true"
              >
                {dot.name}
              </text>
            );
          })}
        </svg>
      </div>

      <button type="button" className={styles.back} onClick={() => onSelect(COUNTRY)}>
        Voltar ao Brasil
      </button>
      <MapLegend
        className={mapStyles.legend}
        finalists={anyLead ? finalists : []}
        showEmpty={anyWithoutLead}
      />
    </section>
  );
}
