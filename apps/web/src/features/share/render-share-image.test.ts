import { describe, expect, it } from 'vitest';
import { DEFAULT_I18N as pt } from '../../i18n/i18n';
import { resultsResponse } from '../../../test/fixtures';
import { finalistsOf } from '../../lib/finalists';
import { contentAt } from './render-share-image';
import { shareContentFrom } from './share-content';

const data = resultsResponse();
const content = shareContentFrom(
  data,
  { kind: 'state', code: 'BA' },
  finalistsOf(data.country),
  pt,
  'x',
);

describe('contentAt', () => {
  it('starts the video intro from zero', () => {
    const start = contentAt(content, 0);
    expect(start.results.map((r) => [r.share, r.votes])).toEqual([
      [0, 0],
      [0, 0],
    ]);
    expect(start.counted).toBe(0);
    expect(start.title).toBe(content.title);
  });

  it('eases towards the real numbers and ends on them', () => {
    const middle = contentAt(content, 0.5);
    expect(middle.results[0]?.share).toBeGreaterThan(35);
    expect(middle.results[0]?.share).toBeLessThan(70);
    expect(contentAt(content, 1)).toBe(content);
    expect(contentAt(content, 1.4)).toBe(content);
  });
});
