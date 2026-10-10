import type { ResultsResponse } from '@stb/contracts';
import { countedPercentage, STATE_CODES, STATES, type StateCode } from '@stb/domain';
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { finalistResults, leadOf, type Finalist } from '../../lib/finalists';
import { formatPercent } from '../../lib/format';
import type { Selection } from '../../lib/selection';
import { BRAZIL_MAP } from './brazil-map';
import styles from './BrazilMap.module.css';
import { MapLegend } from './MapLegend';

interface Props {
  readonly data: ResultsResponse;
  readonly finalists: readonly Finalist[];
  readonly selection: Selection;
  readonly onSelect: (selection: Selection) => void;
}

interface Hover {
  readonly code: StateCode;
  readonly x: number;
  readonly y: number;
}

/** Labels for states too small to fit their code inside are skipped. */
const UNLABELED = new Set<StateCode>(['DF', 'SE', 'AL', 'PB', 'RN', 'ES', 'RJ']);

/** Choropleth: each state takes the leader's hue, darker the wider the margin. */
export function BrazilMap({ data, finalists, selection, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<Hover>();

  const describe = (code: StateCode) => {
    const results = finalistResults(data.states[code], finalists);
    const lead = leadOf(results);
    return { results, lead, counted: countedPercentage(data.states[code]) };
  };

  const ariaLabel = (code: StateCode) => {
    const { lead, counted } = describe(code);
    const status = lead
      ? `${lead.leader.name} lidera com ${formatPercent(lead.leader.share)}`
      : 'sem votos apurados';
    return `${STATES[code].name}: ${status}, ${formatPercent(counted)} apurado`;
  };

  const isDimmed = (code: StateCode) =>
    selection.kind === 'region' && STATES[code].region !== selection.code;

  const hoverAt = (code: StateCode, clientX: number, clientY: number) => {
    const box = containerRef.current?.getBoundingClientRect();
    if (box) setHover({ code, x: clientX - box.left, y: clientY - box.top });
  };

  const onPointerMove = (code: StateCode) => (event: PointerEvent<SVGPathElement>) => {
    if (event.pointerType === 'mouse') hoverAt(code, event.clientX, event.clientY);
  };

  const onFocus = (code: StateCode) => (event: React.FocusEvent<SVGPathElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    hoverAt(code, box.left + box.width / 2, box.top + box.height / 2);
  };

  const onKeyDown = (code: StateCode) => (event: KeyboardEvent<SVGPathElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect({ kind: 'state', code });
    }
  };

  const hovered = hover && describe(hover.code);

  return (
    <section className={`card ${styles.card}`} aria-labelledby="map-title">
      <h2 id="map-title" className="visually-hidden">
        Mapa da apuração por estado
      </h2>
      <div
        ref={containerRef}
        className={styles.container}
        onPointerLeave={() => setHover(undefined)}
      >
        <svg className={styles.map} viewBox={BRAZIL_MAP.viewBox} role="group" aria-label="Estados">
          {STATE_CODES.map((code) => {
            const lead = describe(code).lead;
            const selected = selection.kind === 'state' && selection.code === code;
            return (
              <path
                key={code}
                d={BRAZIL_MAP.states[code].d}
                className={styles.state}
                data-hue={lead?.hue ?? 'none'}
                data-intensity={lead?.intensity ?? 0}
                data-selected={selected || undefined}
                data-dimmed={isDimmed(code) || undefined}
                tabIndex={0}
                role="button"
                aria-pressed={selected}
                aria-label={ariaLabel(code)}
                onClick={() => onSelect({ kind: 'state', code })}
                onKeyDown={onKeyDown(code)}
                onPointerMove={onPointerMove(code)}
                onFocus={onFocus(code)}
                onBlur={() => setHover(undefined)}
              />
            );
          })}
          {STATE_CODES.filter((code) => !UNLABELED.has(code)).map((code) => {
            const [x = 0, y = 0] = BRAZIL_MAP.states[code].label;
            return (
              <text key={code} x={x} y={y} className={styles.label} aria-hidden="true">
                {code}
              </text>
            );
          })}
        </svg>

        {hover && hovered && (
          <div
            className={styles.tooltip}
            style={{ left: hover.x, top: hover.y }}
            role="presentation"
            aria-hidden="true"
          >
            <div className={styles.tooltipTitle}>{STATES[hover.code].name}</div>
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
