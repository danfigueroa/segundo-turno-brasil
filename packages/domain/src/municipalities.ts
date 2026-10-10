import { rankCandidates } from './standings';
import type { Tally } from './tally';

/**
 * How one Brazilian municipality voted. Compact on purpose (a state has up to 853 of
 * them): candidate names and parties come from the state's tally.
 */
export interface MunicipalityResult {
  /** IBGE code (7 digits), the key of the municipal map, e.g. "3550308" for São Paulo. */
  readonly ibge: string;
  /** Name as the TSE publishes it (uppercase, with accents), e.g. "SÃO PAULO". */
  readonly name: string;
  readonly electorate: number;
  /** Voters who showed up. */
  readonly turnout: number;
  /** Valid votes per candidate, keyed by ballot number. */
  readonly votes: Readonly<Record<string, number>>;
  readonly ballots: { readonly valid: number; readonly blank: number; readonly null: number };
  readonly sections: { readonly total: number; readonly counted: number };
  /** ISO 8601 timestamp of the municipality's last TSE totalization. */
  readonly updatedAt: string;
}

/**
 * A municipality as a full tally, so it can be shown like any other scope. Candidates
 * keep the names and parties of the state's tally; shares are of the municipality's valid
 * votes. There is no municipal scope kind: the tally keeps the state as its scope.
 */
export function municipalityTally(
  municipality: MunicipalityResult,
  state: Tally,
): Tally {
  return {
    scope: state.scope,
    candidates: rankCandidates(
      state.candidates.map(({ number, name, party }) => ({
        number,
        name,
        party,
        votes: municipality.votes[number] ?? 0,
      })),
    ),
    sections: municipality.sections,
    electorate: municipality.electorate,
    turnout: municipality.turnout,
    votes: municipality.ballots,
    updatedAt: municipality.updatedAt,
  };
}
