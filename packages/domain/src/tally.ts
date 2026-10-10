import type { RegionCode, StateCode } from './states';

/** Geographic coverage of a tally. `abroad` holds votes cast outside Brazil. */
export type Scope =
  | { readonly kind: 'country' }
  | { readonly kind: 'region'; readonly code: RegionCode }
  | { readonly kind: 'state'; readonly code: StateCode }
  | { readonly kind: 'abroad' };

export interface CandidateResult {
  /** Ballot number (e.g. "13"). Stable identifier of the candidate. */
  readonly number: string;
  /** Ballot name (e.g. "LULA"). */
  readonly name: string;
  /** Party or coalition abbreviation. */
  readonly party: string;
  readonly votes: number;
  /** Percentage of valid votes, 0–100. */
  readonly share: number;
}

/** Vote count for one scope at one point in time. */
export interface Tally {
  readonly scope: Scope;
  /** Candidates sorted by votes, descending. */
  readonly candidates: readonly CandidateResult[];
  readonly sections: { readonly total: number; readonly counted: number };
  readonly electorate: number;
  /** Voters who showed up. */
  readonly turnout: number;
  readonly votes: { readonly valid: number; readonly blank: number; readonly null: number };
  /** ISO 8601 timestamp of the official TSE totalization. */
  readonly updatedAt: string;
}
