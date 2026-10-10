import type { AbroadResponse, CitiesResponse, ResultsResponse } from '@stb/contracts';
import {
  rankCandidates,
  STATE_CODES,
  type AbroadCityResult,
  type Scope,
  type StateCode,
  type Tally,
} from '@stb/domain';

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

function city(
  code: string,
  name: string,
  country: string,
  lat: number,
  lon: number,
  votes: Record<string, number>,
): AbroadCityResult {
  const continent = country === 'Portugal' ? 'EU' : 'AM';
  const sections = { total: 5, counted: 3 };
  return { code, name, country, continent, lat, lon, electorate: 1000, votes, sections };
}

/**
 * Votes abroad by country and city: Flávio ahead in the United States, Lula in Portugal, a
 * tie in Haiti.
 */
export function abroadResponse(overrides: Partial<AbroadResponse> = {}): AbroadResponse {
  const sections = { total: 10, counted: 5 };
  return {
    round: 2,
    countries: [
      { name: 'Estados Unidos', continent: 'AM', votes: { '13': 4, '22': 12 }, sections },
      { name: 'Portugal', continent: 'EU', votes: { '13': 6, '22': 3 }, sections },
      { name: 'Haiti', continent: 'AM', votes: { '13': 1, '22': 1 }, sections },
    ],
    cities: [
      city('39080', 'ATLANTA', 'Estados Unidos', 33.7, -84.4, { '13': 1, '22': 5 }),
      city('30406', 'MIAMI', 'Estados Unidos', 25.8, -80.2, { '13': 3, '22': 7 }),
      city('29955', 'LISBOA', 'Portugal', 38.7, -9.1, { '13': 6, '22': 3 }),
      city('29718', 'PORTO PRÍNCIPE', 'Haiti', 18.5, -72.3, { '13': 1, '22': 1 }),
    ],
    fetchedAt: '2026-10-25T22:42:10.000Z',
    stale: false,
    ...overrides,
  };
}

/** Municipalities of Bahia: Lula ahead in Salvador and Feira de Santana, Flávio in Barreiras. */
export function citiesResponse(overrides: Partial<CitiesResponse> = {}): CitiesResponse {
  const municipality = (ibge: string, name: string, lula: number, flavio: number) => ({
    ibge,
    name,
    electorate: (lula + flavio) * 2,
    turnout: lula + flavio + 10,
    votes: { '13': lula, '22': flavio },
    ballots: { valid: lula + flavio, blank: 4, null: 6 },
    sections: { total: 10, counted: 5 },
    updatedAt: '2026-10-25T19:40:00-03:00',
  });
  return {
    round: 2,
    uf: 'BA',
    cities: [
      municipality('2927408', 'SALVADOR', 700, 300),
      municipality('2910800', 'FEIRA DE SANTANA', 400, 350),
      municipality('2903201', 'BARREIRAS', 100, 300),
    ],
    fetchedAt: '2026-10-25T22:42:10.000Z',
    stale: false,
    ...overrides,
  };
}
