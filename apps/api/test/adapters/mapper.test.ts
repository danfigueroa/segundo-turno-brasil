import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseTseDateTime, toTally } from '../../src/adapters/tse/mapper';
import { tseResultFileSchema } from '../../src/adapters/tse/schema';
import { FIRST_ROUND_2026 } from '../helpers';

const brFile = tseResultFileSchema.parse(
  JSON.parse(readFileSync(join(FIRST_ROUND_2026, 'br.json'), 'utf8')),
);

describe('parseTseDateTime', () => {
  it('converts Brasília date and time to ISO 8601', () => {
    expect(parseTseDateTime('25/10/2026', '19:05:30')).toBe('2026-10-25T19:05:30-03:00');
  });

  it('rejects malformed values', () => {
    expect(() => parseTseDateTime('2026-10-25', '19:05:30')).toThrow();
  });
});

describe('toTally', () => {
  const tally = toTally(brFile, { kind: 'country' });

  it('ranks the presidential candidates by votes', () => {
    expect(tally.candidates.slice(0, 2).map((c) => [c.number, c.name, c.party, c.votes])).toEqual([
      ['22', 'FLAVIO BOLSONARO', 'PL', 56_104_503],
      ['13', 'LULA', 'PT', 53_879_538],
    ]);
    expect(tally.candidates).toHaveLength(12);
  });

  it('computes shares that match the official percentages', () => {
    expect(tally.candidates[0]?.share).toBeCloseTo(47.03, 2);
  });

  it('maps sections, electorate and vote kinds', () => {
    expect(tally.sections).toEqual({ total: 499_248, counted: 499_248 });
    expect(tally.electorate).toBe(158_745_502);
    // Every section counted: all of the electorate is behind the counted sections.
    expect(tally.countedElectorate).toBe(158_745_502);
    expect(tally.turnout).toBe(125_275_835);
    expect(tally.votes).toEqual({ valid: 119_300_788, blank: 2_300_798, null: 3_674_249 });
  });

  it('uses the totalization time', () => {
    expect(tally.updatedAt).toBe('2026-10-05T12:51:05-03:00');
  });

  it('falls back to the generation time before counting starts', () => {
    const empty = toTally({ ...brFile, dt: '', ht: '' }, { kind: 'country' });
    expect(empty.updatedAt).toBe('2026-10-05T12:51:47-03:00');
  });

  it('fails when the file has no presidential results', () => {
    expect(() => toTally({ ...brFile, carg: [] }, { kind: 'country' })).toThrow(/presidential/);
  });
});

describe('tseResultFileSchema', () => {
  it('treats empty numbers as zero', () => {
    const parsed = tseResultFileSchema.parse({
      cdabr: 'br',
      dg: '25/10/2026',
      hg: '08:00:00',
      dt: '',
      ht: '',
      carg: [
        { cd: '1', agr: [{ par: [{ sg: 'PT', cand: [{ n: '13', nmu: 'LULA', vap: '' }] }] }] },
      ],
      s: { ts: '10', st: '' },
      e: { te: '100', c: '' },
      v: { vv: '', vb: '', tvn: '' },
    });
    expect(parsed.s.st).toBe(0);
  });

  it('rejects non-numeric counts', () => {
    const raw = JSON.parse(readFileSync(join(FIRST_ROUND_2026, 'br.json'), 'utf8'));
    raw.s.st = '12,5';
    expect(tseResultFileSchema.safeParse(raw).success).toBe(false);
  });
});
