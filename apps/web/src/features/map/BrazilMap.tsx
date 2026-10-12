import type { ResultsResponse } from '@stb/contracts';
import { countedPercentage, STATE_CODES, STATES, type StateCode, type Tally } from '@stb/domain';
import type { KeyboardEvent } from 'react';
import { finalistResults, leadOf, type Finalist } from '../../lib/finalists';
import { formatPercent } from '../../lib/format';
import { useMediaQuery } from '../../lib/use-media-query';
import { ABROAD, type Selection } from '../../lib/selection';
import { BRAZIL_MAP } from './brazil-map';
import { prefetchStateMap } from '../state-map/state-maps';
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

/** Labels for states too small to fit their code inside are skipped. */
const UNLABELED = new Set<StateCode>(['DF', 'SE', 'AL', 'PB', 'PE', 'RN', 'ES', 'RJ']);

const areaName = (area: Area) => (area === 'abroad' ? 'Exterior' : STATES[area].name);
const areaSelection = (area: Area): Selection =>
  area === 'abroad' ? ABROAD : { kind: 'state', code: area };

/** Choropleth: each state takes the leader's hue, darker the wider the margin. */
export function BrazilMap({ data, finalists, selection, onSelect }: Props) {
  const wide = useMediaQuery('(min-width: 960px)');

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

  /** Selection props shared by states and the abroad button. */
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
    } as const;
  };

  /** SVG paths are not buttons: give them the role and keyboard activation. */
  const statePath = (code: StateCode) => ({
    ...interactive(code),
    tabIndex: 0,
    role: 'button',
    onPointerDown: () => prefetchStateMap(code),
    onKeyDown: (event: KeyboardEvent<SVGElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect(areaSelection(code));
      }
    },
  });

  return (
    <section className={`card ${styles.card}`} aria-labelledby="map-title">
      <div className={styles.head}>
        <h2 id="map-title" className={styles.title}>
          Quem lidera em cada estado
        </h2>
        <p className={styles.subtitle}>
          {!anyLead
            ? 'Os estados ganham cor conforme as urnas são apuradas.'
            : wide
              ? 'Clique em um estado ou no Exterior.'
              : 'Toque em um estado ou no Exterior para ver o resultado.'}
        </p>
      </div>

      <div className={styles.container}>
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
      </div>

      <StateSelect
        className={styles.select}
        label={wide ? 'Ir para um estado' : 'Ou escolha um estado'}
        selection={selection}
        onSelect={onSelect}
      />
      <MapLegend
        className={styles.legend}
        finalists={anyLead ? finalists : []}
        showEmpty={anyWithoutLead}
      />
    </section>
  );
}
