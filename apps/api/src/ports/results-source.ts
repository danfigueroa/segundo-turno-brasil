import type { StateCode, Tally } from '@stb/domain';

/** Every scope of the election at one point in time. */
export interface ElectionSnapshot {
  readonly country: Tally;
  readonly states: Readonly<Record<StateCode, Tally>>;
  readonly abroad: Tally;
}

/** Port: where election results come from (TSE, fixtures, simulation…). */
export interface ResultsSource {
  fetchSnapshot(): Promise<ElectionSnapshot>;
}
