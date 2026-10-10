import type { AbroadResponse } from '@stb/contracts';
import { CONTINENT_CODES, CONTINENT_NAMES, type ContinentCode } from '@stb/domain';
import { useMemo, useState, type CSSProperties } from 'react';
import type { Finalist } from '../../lib/finalists';
import { COUNTRY, type Selection } from '../../lib/selection';
import filterStyles from '../countries/CountriesList.module.css';
import mapStyles from '../map/BrazilMap.module.css';
import { useMediaQuery } from '../../lib/use-media-query';
import { MapLegend } from '../map/MapLegend';
import { cityDots, labeledDots } from './city-dots';
import { useTweenedViewBox } from './use-tweened-view-box';
import { fitViewBox, formatViewBox, parseViewBox } from './viewport';
import { WORLD_MAP } from './world-map';
import styles from './WorldMap.module.css';

interface Props {
  /** Votes abroad by city; `undefined` while loading (the land is drawn alone). */
  readonly abroad: AbroadResponse | undefined;
  readonly finalists: readonly Finalist[];
  readonly onSelect: (selection: Selection) => void;
}

type Zoom = ContinentCode | 'ALL';

const ZOOMS: { value: Zoom; label: string }[] = [
  { value: 'ALL', label: 'Mundo' },
  ...CONTINENT_CODES.map((code) => ({ value: code, label: CONTINENT_NAMES[code] })),
];

const WORLD = parseViewBox(WORLD_MAP.viewBox);
/** How many of the biggest cities get a name: more when zoomed into a continent. */
const LABELS = { world: 6, continent: 8 };
/** Minimum distance between two names, in viewBox units of the whole world. */
const LABEL_DISTANCE = 150;
/** Font size of the names in viewBox units of the whole world, as in the CSS. */
const LABEL_SIZE = { phone: 32, desktop: 19 };
/** Average width of a character of the names, as a share of the font size. */
const CHAR_WIDTH = 0.6;

/**
 * Votes abroad on a world map: a dot per city with polling stations, sized by its
 * electorate and colored like the states. A continent chip zooms into its cities, which
 * grow less than the map so clusters (Europe) come apart. The dots are a picture; the
 * list by country below is the accessible way through the numbers.
 */
export default function WorldMap({ abroad, finalists, onSelect }: Props) {
  const [zoom, setZoom] = useState<Zoom>('ALL');
  const wide = useMediaQuery('(min-width: 960px)');
  const dots = useMemo(
    () => (abroad ? cityDots(abroad.cities, finalists, WORLD_MAP.projection) : []),
    [abroad, finalists],
  );
  const inView = useMemo(
    () => (zoom === 'ALL' ? dots : dots.filter((d) => d.continent === zoom)),
    [dots, zoom],
  );
  const target = useMemo(
    () => (zoom === 'ALL' ? WORLD : fitViewBox(inView, WORLD)),
    [inView, zoom],
  );
  const view = useTweenedViewBox(target);
  // How much the map is magnified: names and strokes divide by it to keep their size.
  const scale = WORLD.width / view.width;
  const targetScale = WORLD.width / target.width;
  const radius = (r: number) => r / Math.sqrt(scale);
  const labels = labeledDots(
    inView,
    zoom === 'ALL' ? LABELS.world : LABELS.continent,
    LABEL_DISTANCE / targetScale,
  );
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
        <div className={filterStyles.filters} role="group" aria-label="Aproximar o mapa">
          {ZOOMS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={filterStyles.filter}
              aria-pressed={zoom === option.value}
              onClick={() => setZoom(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <svg
          className={styles.map}
          viewBox={formatViewBox(view)}
          style={{ '--scale': scale } as CSSProperties}
          role="group"
          aria-label={zoom === 'ALL' ? 'Mundo' : CONTINENT_NAMES[zoom]}
        >
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
                r={radius(dot.r)}
                className={`${mapStyles.state} ${styles.dot}`}
                data-hue={dot.lead?.hue ?? 'none'}
                data-intensity={dot.lead?.intensity ?? 0}
                data-dimmed={zoom !== 'ALL' && dot.continent !== zoom ? '' : undefined}
              />
            ))}
          </g>
          {labels.map((dot) => {
            // A name that would run off the right edge goes on the left of its dot.
            const offset = radius(dot.r) + 4 / scale;
            const size = (wide ? LABEL_SIZE.desktop : LABEL_SIZE.phone) / scale;
            const flip = dot.x + offset + dot.name.length * size * CHAR_WIDTH > view.x + view.width;
            return (
              <text
                key={dot.code}
                x={flip ? dot.x - offset : dot.x + offset}
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
