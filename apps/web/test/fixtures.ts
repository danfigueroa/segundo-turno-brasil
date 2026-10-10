import type { AbroadResponse, ResultsResponse } from '@stb/contracts';
import { rankCandidates, STATE_CODES, type Scope, type StateCode, type Tally } from '@stb/domain';

export function tally(scope: Scope, lula: number, flavio: number, counted = 50): Tally {
  const candidates = rankCandidates([
    { number: '13', name: 'LULA', party: 'PT', votes: lula },
    { number: '22', name: 'FLAVIO BOLSONARO', party: 'PL', votes: flavio },
  ]);
  return {
    scope,
    candidates,
    sections: { total: 100, counted },
    electorate: 1000,
    turnout: 800,
    votes: { valid: lula + flavio, blank: 10, null: 20 },
    updatedAt: '2026-10-25T19:42:00-03:00',
  };
}

/** A runoff snapshot where Lula leads in the Northeast and Flávio elsewhere. */
export function resultsResponse(overrides: Partial<ResultsResponse> = {}): ResultsResponse {
  const northeast = new Set(['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE']);
  const states = Object.fromEntries(
    STATE_CODES.map((code) => [
      code,
      northeast.has(code)
        ? tally({ kind: 'state', code }, 700, 300)
        : tally({ kind: 'state', code }, 400, 600),
    ]),
  ) as Record<StateCode, Tally>;
  return {
    round: 2,
    country: tally({ kind: 'country' }, 12_000, 12_400),
    states,
    abroad: tally({ kind: 'abroad' }, 10, 20),
    fetchedAt: '2026-10-25T22:42:10.000Z',
    stale: false,
    ...overrides,
  };
}

/** Votes abroad by country: Flávio ahead in the United States, Lula in Portugal, a tie in Haiti. */
export function abroadResponse(overrides: Partial<AbroadResponse> = {}): AbroadResponse {
  const sections = { total: 10, counted: 5 };
  return {
    round: 2,
    countries: [
      { name: 'Estados Unidos', continent: 'AM', votes: { '13': 4, '22': 12 }, sections },
      { name: 'Portugal', continent: 'EU', votes: { '13': 6, '22': 3 }, sections },
      { name: 'Haiti', continent: 'AM', votes: { '13': 1, '22': 1 }, sections },
    ],
    fetchedAt: '2026-10-25T22:42:10.000Z',
    stale: false,
    ...overrides,
  };
}
