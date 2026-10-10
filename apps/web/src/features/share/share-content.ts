import type { ResultsResponse } from '@stb/contracts';
import { countedPercentage, STATE_CODES, STATES, type StateCode, type Tally } from '@stb/domain';
import { finalistResults, leadOf, type Finalist, type FinalistResult } from '../../lib/finalists';
import { resolveTally, selectionTitle, type Selection } from '../../lib/selection';
import { SHARE_PALETTE } from './palette';

/** Everything the share image shows, already resolved for the current selection. */
export interface ShareContent {
  readonly title: string;
  readonly results: readonly FinalistResult[];
  readonly leaderNumber: string | undefined;
  /** 0–100. */
  readonly counted: number;
  readonly updatedAt: string;
  readonly mapFills: Readonly<Record<StateCode, string>>;
  /** Fill of the abroad tile. */
  readonly abroadFill: string;
  /** States outside the selection are drawn faded. */
  readonly focus: ReadonlySet<StateCode>;
  /** Whether the abroad tile is in the selection (country or abroad). */
  readonly abroadInFocus: boolean;
  readonly siteUrl: string;
}

export function shareContentFrom(
  data: ResultsResponse,
  selection: Selection,
  finalists: readonly Finalist[],
  siteUrl: string,
): ShareContent {
  const tally = resolveTally(data, selection);
  const results = finalistResults(tally, finalists);

  const fillOf = (scopeTally: Tally) => {
    const lead = leadOf(finalistResults(scopeTally, finalists));
    const fill = lead ? SHARE_PALETTE.ramps[lead.hue][lead.intensity - 1] : undefined;
    return fill ?? SHARE_PALETTE.mapEmpty;
  };
  const mapFills = Object.fromEntries(
    STATE_CODES.map((code) => [code, fillOf(data.states[code])]),
  ) as Record<StateCode, string>;

  const focus = new Set(
    STATE_CODES.filter(
      (code) =>
        selection.kind === 'country' ||
        (selection.kind === 'region' && STATES[code].region === selection.code) ||
        (selection.kind === 'state' && selection.code === code),
    ),
  );

  return {
    title: selectionTitle(selection),
    results,
    leaderNumber: leadOf(results)?.leader.number,
    counted: countedPercentage(tally),
    updatedAt: tally.updatedAt,
    mapFills,
    abroadFill: fillOf(data.abroad),
    focus,
    abroadInFocus: selection.kind === 'country' || selection.kind === 'abroad',
    siteUrl,
  };
}
