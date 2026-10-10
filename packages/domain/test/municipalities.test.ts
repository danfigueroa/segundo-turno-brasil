import { describe, expect, it } from 'vitest';
import { municipalityTally, rankCandidates, type MunicipalityResult, type Tally } from '../src';

const state: Tally = {
  scope: { kind: 'state', code: 'AC' },
  candidates: rankCandidates([
    { number: '13', name: 'LULA', party: 'PT', votes: 1000 },
    { number: '22', name: 'FLAVIO BOLSONARO', party: 'PL', votes: 3000 },
  ]),
  sections: { total: 100, counted: 100 },
  electorate: 5000,
  turnout: 4200,
  votes: { valid: 4000, blank: 100, null: 100 },
  updatedAt: '2026-10-04T19:00:00-03:00',
};

const acrelandia: MunicipalityResult = {
  ibge: '1200013',
  name: 'ACRELÂNDIA',
  electorate: 11000,
  turnout: 8600,
  votes: { '13': 3000, '22': 5000 },
  ballots: { valid: 8000, blank: 300, null: 300 },
  sections: { total: 40, counted: 30 },
  updatedAt: '2026-10-04T18:10:00-03:00',
};

describe('municipalityTally', () => {
  it("takes the municipality's numbers and the state's candidate names", () => {
    const tally = municipalityTally(acrelandia, state);
    expect(tally.candidates).toEqual([
      { number: '22', name: 'FLAVIO BOLSONARO', party: 'PL', votes: 5000, share: 62.5 },
      { number: '13', name: 'LULA', party: 'PT', votes: 3000, share: 37.5 },
    ]);
    expect(tally).toMatchObject({
      scope: { kind: 'state', code: 'AC' },
      sections: { total: 40, counted: 30 },
      electorate: 11000,
      turnout: 8600,
      votes: { valid: 8000, blank: 300, null: 300 },
      updatedAt: '2026-10-04T18:10:00-03:00',
    });
  });

  it('gives zero votes to a candidate missing in the municipality', () => {
    const tally = municipalityTally({ ...acrelandia, votes: { '22': 10 } }, state);
    expect(tally.candidates.find((c) => c.number === '13')).toMatchObject({ votes: 0, share: 0 });
  });
});
