import { describe, expect, it } from 'vitest';
import { resultsResponse } from '../../../test/fixtures';
import { finalistsOf } from '../../lib/finalists';
import { netMargins } from './net-margins';

const data = resultsResponse();
const finalists = finalistsOf(data.country);

describe('netMargins', () => {
  it('lists every state and abroad nationally, widest margins first', () => {
    const { rows, total, scale } = netMargins(data, finalists, { kind: 'country' });
    expect(rows).toHaveLength(28);
    // Lula (13) is the first finalist: +400 in the Northeast, −200 elsewhere, −10 abroad.
    expect(rows[0]).toMatchObject({ code: 'AL', margin: 400 });
    expect(rows.at(-1)).toMatchObject({ code: 'EXT', margin: -10, target: { kind: 'abroad' } });
    expect(total).toBe(9 * 400 - 18 * 200 - 10);
    expect(scale).toBe(400);
  });

  it('lists the states of the region of a selected state', () => {
    const { rows } = netMargins(data, finalists, { kind: 'state', code: 'PR' });
    expect(rows.map((r) => r.code)).toEqual(['PR', 'RS', 'SC']);
  });
});
