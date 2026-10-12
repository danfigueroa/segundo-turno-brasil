import type { ResultsResponse } from '@stb/contracts';
import { outlook } from '@stb/domain';
import type { Finalist } from './finalists';

/**
 * The president-elect: the national leader of the runoff once the runner-up can no longer
 * overtake, even before the count ends (see `outlook`). `undefined` before that and in
 * the first round.
 */
export function winnerOf(
  data: ResultsResponse,
  finalists: readonly Finalist[],
): Finalist | undefined {
  if (data.round !== 2) return undefined;
  const result = outlook(data.country);
  if (!result?.decided) return undefined;
  return finalists.find((f) => f.number === result.leader.number);
}
