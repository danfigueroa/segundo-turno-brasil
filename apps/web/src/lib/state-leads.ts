import type { ResultsResponse } from '@stb/contracts';
import type { StateCode } from '@stb/domain';
import { finalistResults, leadOf, type Finalist, type StateLead } from './finalists';

export interface StateLeads {
  /** How many of the states each finalist leads, keyed by ballot number. */
  readonly counts: Readonly<Record<string, number>>;
  /** States with no votes counted yet, or tied. */
  readonly undecided: number;
  /** The state with the widest margin, if any state has a leader. */
  readonly widest: { readonly code: StateCode; readonly lead: StateLead } | undefined;
}

/** Who leads in each of the given states, as used by the region headline. */
export function stateLeads(
  data: ResultsResponse,
  finalists: readonly Finalist[],
  codes: readonly StateCode[],
): StateLeads {
  const counts: Record<string, number> = Object.fromEntries(finalists.map((f) => [f.number, 0]));
  let undecided = 0;
  let widest: StateLeads['widest'];
  for (const code of codes) {
    const lead = leadOf(finalistResults(data.states[code], finalists));
    if (!lead) {
      undecided += 1;
      continue;
    }
    counts[lead.leader.number] = (counts[lead.leader.number] ?? 0) + 1;
    if (!widest || lead.margin > widest.lead.margin) widest = { code, lead };
  }
  return { counts, undecided, widest };
}
