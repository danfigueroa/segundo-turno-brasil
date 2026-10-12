import { describe, expect, it } from 'vitest';
import { resultsResponse, tally } from '../../../test/fixtures';
import { finalistsOf } from '../../lib/finalists';
import { compare2022View } from './compare-2022';

const data = resultsResponse();
const finalists = finalistsOf(data.country);

describe('compare2022View', () => {
  it('compares each ballot number with the 2022 runoff', () => {
    const view = compare2022View(data, { kind: 'state', code: 'BA' }, finalists);
    // Bahia, 2022: Lula 6.097.815 × Jair Bolsonaro 2.357.028.
    expect(view?.rows.map((r) => [r.finalist.shortName, r.name2022])).toEqual([
      ['Lula', 'Lula'],
      ['Flávio', 'Jair Bolsonaro'],
    ]);
    expect(view?.rows[0]?.before).toBeCloseTo(72.12, 2);
    expect(view?.rows[0]?.now).toBe(70);
    expect(view?.rows[0]?.change).toBeCloseTo(-2.12, 2);
    expect(view?.flipped).toBeUndefined();
    expect(view?.atSameCount).toBeUndefined();
  });

  it('adds the same moment of the 2022 count for Brazil', () => {
    const view = compare2022View(data, { kind: 'country' }, finalists);
    expect(view?.rows[0]?.before).toBeCloseTo(50.9, 2);
    expect(view?.atSameCount?.counted).toBe(50);
    expect(view?.atSameCount?.shares.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 6);
  });

  it('lists the states led by the other ballot number than in 2022', () => {
    const view = compare2022View(data, { kind: 'country' }, finalists);
    // Lula won Minas Gerais in 2022; the fixture has Flávio ahead there.
    expect(view?.flipped).toContainEqual({
      code: 'MG',
      from: { shortName: 'Lula', hue: 'red' },
      to: expect.objectContaining({ number: '22' }),
    });
    // Bolsonaro won Santa Catarina in 2022, as Flávio leads there now.
    expect(view?.flipped?.some((f) => f.code === 'SC')).toBe(false);
  });

  it('adds up the states of a region', () => {
    const view = compare2022View(data, { kind: 'region', code: 'NE' }, finalists);
    expect(view?.rows[0]?.before).toBeGreaterThan(65);
    expect(view?.flipped).toEqual([]);
  });

  it('has nothing to compare for a city or other ballot numbers', () => {
    expect(
      compare2022View(data, { kind: 'city', state: 'BA', ibge: '2927408' }, finalists),
    ).toBeUndefined();
    const other = { ...tally({ kind: 'country' }, 1, 2), candidates: [] };
    const strangers = finalistsOf({
      ...other,
      candidates: [
        { number: '30', name: 'A', party: 'X', votes: 2, share: 66 },
        { number: '50', name: 'B', party: 'Y', votes: 1, share: 33 },
      ],
    });
    expect(compare2022View(data, { kind: 'country' }, strangers)).toBeUndefined();
  });
});
