import type { ResultsResponse } from '@stb/contracts';
import { countedPercentage, STATE_CODES, STATES, type StateCode, type Tally } from '@stb/domain';
import { useState, type FocusEvent, type KeyboardEvent, type PointerEvent } from 'react';
import { finalistResults, leadOf, type Finalist } from '../../lib/finalists';
import { formatPercent } from '../../lib/format';
import { ABROAD, type Selection } from '../../lib/selection';
import { BRAZIL_MAP } from './brazil-map';
import { emphasisOf, type Area } from './emphasis';
import styles from './BrazilMap.module.css';
import { MapLegend } from './MapLegend';
import { StateSelect } from './StateSelect';

interface Props {
  readonly data: ResultsResponse;
  readonly finalists: readonly Finalist[];
  readonly selection: Selection;
  readonly onSelect: (selection: Selection) => void;
}

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

  const leads = [...STATE_CODES, 'abroad' as const].map((area) => describe(area).lead);
  const anyLead = leads.some(Boolean);
  const anyWithoutLead = leads.some((lead) => !lead);

  /** Positions the tooltip relative to the map container that holds `target`. */
  const hoverAt = (area: Area, target: Element, clientX: number, clientY: number) => {
    const box = target.closest(`.${styles.container}`)?.getBoundingClientRect();
    if (box) setHover({ area, x: clientX - box.left, y: clientY - box.top });
  };

  /** Selection, hover and focus props shared by states and the abroad button. */
  const interactive = (area: Area) => {
    const { lead, counted } = describe(area);
    const status = lead
      ? `${lead.leader.name} lidera com ${formatPercent(lead.leader.share)}`
      : 'sem votos apurados';
    return {
      'aria-pressed': isSelected(area),
      'aria-label': `${areaName(area)}: ${status}, ${formatPercent(counted)} apurado`,
      'data-hue': lead?.hue ?? 'none',
      'data-intensity': lead?.intensity ?? 0,
      'data-selected': isSelected(area) || undefined,
      'data-emphasis': emphasisOf(area, selection),
      onClick: () => onSelect(areaSelection(area)),
      onPointerMove: (event: PointerEvent<Element>) => {
        if (event.pointerType === 'mouse') {
          hoverAt(area, event.currentTarget, event.clientX, event.clientY);
        }
      },
      onFocus: (event: FocusEvent<Element>) => {
        const box = event.currentTarget.getBoundingClientRect();
        hoverAt(area, event.currentTarget, box.left + box.width / 2, box.top + box.height / 2);
      },
      onBlur: () => setHover(undefined),
    } as const;
  };

  /** SVG paths are not buttons: give them the role and keyboard activation. */
  const statePath = (code: StateCode) => ({
    ...interactive(code),
    tabIndex: 0,
    role: 'button',
    onKeyDown: (event: KeyboardEvent<SVGElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect(areaSelection(code));
      }
    },
  });

  const hovered = hover && describe(hover.area);

  return (
    <section className={`card ${styles.card}`} aria-labelledby="map-title">
      <div className={styles.head}>
        <h2 id="map-title" className={styles.title}>
          Quem lidera em cada estado
        </h2>
        <p className={styles.subtitle}>
          {anyLead
            ? 'Toque em um estado ou no Exterior para ver o resultado.'
            : 'Os estados ganham cor conforme as urnas são apuradas.'}
        </p>
      </div>

      <div className={styles.container} onPointerLeave={() => setHover(undefined)}>
        <svg className={styles.map} viewBox={BRAZIL_MAP.viewBox} role="group" aria-label="Estados">
          {STATE_CODES.map((code) => (
            <path
              key={code}
              d={BRAZIL_MAP.states[code].d}
              className={styles.state}
              {...statePath(code)}
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
        </svg>
        <button
          type="button"
          className={`${styles.state} ${styles.abroad}`}
          {...interactive('abroad')}
        >
          Exterior
        </button>

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

      <StateSelect className={styles.select} selection={selection} onSelect={onSelect} />
      <MapLegend
        className={styles.legend}
        finalists={anyLead ? finalists : []}
        showEmpty={anyWithoutLead}
      />
    </section>
  );
}
