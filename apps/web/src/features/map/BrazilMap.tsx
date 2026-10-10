import type { ResultsResponse } from '@stb/contracts';
import { countedPercentage, STATE_CODES, STATES, type StateCode, type Tally } from '@stb/domain';
import { useState, type FocusEvent, type KeyboardEvent, type PointerEvent } from 'react';
import { finalistResults, leadOf, type Finalist } from '../../lib/finalists';
import { formatPercent } from '../../lib/format';
import { ABROAD, type Selection } from '../../lib/selection';
import { ABROAD_TILE, BRAZIL_MAP } from './brazil-map';
import styles from './BrazilMap.module.css';
import { MapLegend } from './MapLegend';

interface Props {
  readonly data: ResultsResponse;
  readonly finalists: readonly Finalist[];
  readonly selection: Selection;
  readonly onSelect: (selection: Selection) => void;
}

/** A clickable area of the map: a state or the abroad tile. */
type Area = StateCode | 'abroad';

interface Hover {
  readonly area: Area;
  readonly x: number;
  readonly y: number;
}

/** Labels for states too small to fit their code inside are skipped. */
const UNLABELED = new Set<StateCode>(['DF', 'SE', 'AL', 'PB', 'RN', 'ES', 'RJ']);

const areaName = (area: Area) => (area === 'abroad' ? 'Exterior' : STATES[area].name);
const areaSelection = (area: Area): Selection =>
  area === 'abroad' ? ABROAD : { kind: 'state', code: area };

/** Choropleth: each state takes the leader's hue, darker the wider the margin. */
export function BrazilMap({ data, finalists, selection, onSelect }: Props) {
  const [hover, setHover] = useState<Hover>();

  const tallyOf = (area: Area): Tally => (area === 'abroad' ? data.abroad : data.states[area]);

  const describe = (area: Area) => {
    const results = finalistResults(tallyOf(area), finalists);
    return { results, lead: leadOf(results), counted: countedPercentage(tallyOf(area)) };
  };

  const isSelected = (area: Area) =>
    area === 'abroad'
      ? selection.kind === 'abroad'
      : selection.kind === 'state' && selection.code === area;

  const isDimmed = (area: Area) => {
    if (selection.kind === 'abroad') return area !== 'abroad';
    if (selection.kind !== 'region') return false;
    return area === 'abroad' || STATES[area].region !== selection.code;
  };

  /** Positions the tooltip relative to the map container that holds `target`. */
  const hoverAt = (area: Area, target: Element, clientX: number, clientY: number) => {
    const box = target.closest(`.${styles.container}`)?.getBoundingClientRect();
    if (box) setHover({ area, x: clientX - box.left, y: clientY - box.top });
  };

  /** Props shared by every interactive area: selection, keyboard, hover and focus. */
  const interactive = (area: Area) => {
    const { lead, counted } = describe(area);
    const status = lead
      ? `${lead.leader.name} lidera com ${formatPercent(lead.leader.share)}`
      : 'sem votos apurados';
    return {
      tabIndex: 0,
      role: 'button',
      'aria-pressed': isSelected(area),
      'aria-label': `${areaName(area)}: ${status}, ${formatPercent(counted)} apurado`,
      'data-hue': lead?.hue ?? 'none',
      'data-intensity': lead?.intensity ?? 0,
      'data-selected': isSelected(area) || undefined,
      'data-dimmed': isDimmed(area) || undefined,
      onClick: () => onSelect(areaSelection(area)),
      onKeyDown: (event: KeyboardEvent<SVGElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(areaSelection(area));
        }
      },
      onPointerMove: (event: PointerEvent<SVGElement>) => {
        if (event.pointerType === 'mouse') {
          hoverAt(area, event.currentTarget, event.clientX, event.clientY);
        }
      },
      onFocus: (event: FocusEvent<SVGElement>) => {
        const box = event.currentTarget.getBoundingClientRect();
        hoverAt(area, event.currentTarget, box.left + box.width / 2, box.top + box.height / 2);
      },
      onBlur: () => setHover(undefined),
    } as const;
  };

  const hovered = hover && describe(hover.area);

  return (
    <section className={`card ${styles.card}`} aria-labelledby="map-title">
      <h2 id="map-title" className="visually-hidden">
        Mapa da apuração por estado
      </h2>
      <div className={styles.container} onPointerLeave={() => setHover(undefined)}>
        <svg className={styles.map} viewBox={BRAZIL_MAP.viewBox} role="group" aria-label="Estados">
          {STATE_CODES.map((code) => (
            <path
              key={code}
              d={BRAZIL_MAP.states[code].d}
              className={styles.state}
              {...interactive(code)}
            />
          ))}
          {STATE_CODES.filter((code) => !UNLABELED.has(code)).map((code) => {
            const [x = 0, y = 0] = BRAZIL_MAP.states[code].label;
            return (
              <text key={code} x={x} y={y} className={styles.label} aria-hidden="true">
                {code}
              </text>
            );
          })}

          <rect
            x={ABROAD_TILE.x}
            y={ABROAD_TILE.y}
            width={ABROAD_TILE.width}
            height={ABROAD_TILE.height}
            rx={ABROAD_TILE.radius}
            className={styles.state}
            {...interactive('abroad')}
          />
          <text
            x={ABROAD_TILE.x + ABROAD_TILE.width / 2}
            y={ABROAD_TILE.y + ABROAD_TILE.height / 2}
            className={styles.label}
            aria-hidden="true"
          >
            Exterior
          </text>
        </svg>

        {hover && hovered && (
          <div
            className={styles.tooltip}
            style={{ left: hover.x, top: hover.y }}
            role="presentation"
            aria-hidden="true"
          >
            <div className={styles.tooltipTitle}>{areaName(hover.area)}</div>
            {hovered.results.map((r) => (
              <div key={r.number} className={styles.tooltipRow} data-hue={r.hue}>
                <strong>{formatPercent(r.share)}</strong>
                <span>{r.name}</span>
              </div>
            ))}
            <div className={styles.tooltipMeta}>{formatPercent(hovered.counted)} apurado</div>
          </div>
        )}
      </div>
      <MapLegend finalists={finalists} />
    </section>
  );
}
