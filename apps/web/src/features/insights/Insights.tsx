import type { ResultsResponse } from '@stb/contracts';
import type { Round } from '@stb/domain';
import { useEffect } from 'react';
import type { Finalist } from '../../lib/finalists';
import { resolveTally, selectionTitle, type Selection } from '../../lib/selection';
import { Compare2022Card } from './Compare2022Card';
import { compare2022View } from './compare-2022';
import { CountCurve } from './CountCurve';
import { NetMarginCard } from './NetMarginCard';
import { OutlookCard } from './OutlookCard';
import { SwingCard } from './SwingCard';
import { recordLive } from './live-history';
import shell from './Insights.module.css';

interface Props {
  readonly round: Round;
  /** The runoff snapshot, always loaded. */
  readonly runoff: ResultsResponse;
  /** The final first round, once loaded. */
  readonly firstRound: ResultsResponse | undefined;
  readonly selection: Selection;
  readonly finalists: readonly Finalist[];
  readonly onSelect: (selection: Selection) => void;
}

/**
 * Analysis below the scoreboard. Runoff: can it still turn around, how the count evolved,
 * where the lead comes from, what changed since the first round and since 2022. First round: where
 * the lead came from. Loaded on demand (ADR 0005).
 */
export default function Insights({
  round,
  runoff,
  firstRound,
  selection,
  finalists,
  onSelect,
}: Props) {
  // Every polled runoff snapshot feeds the count curve, whatever is on screen.
  useEffect(() => recordLive(runoff), [runoff]);

  const place = selectionTitle(selection);

  if (round === 1) {
    if (!firstRound) return null;
    return (
      <div className={shell.grid}>
        <NetMarginCard
          data={firstRound}
          selection={selection}
          finalists={finalists}
          onSelect={onSelect}
        />
      </div>
    );
  }

  const vs2022 = compare2022View(runoff, selection, finalists);
  return (
    <div className={shell.grid}>
      <OutlookCard tally={resolveTally(runoff, selection)} finalists={finalists} place={place} />
      <CountCurve runoff={runoff} selection={selection} finalists={finalists} />
      <NetMarginCard
        data={runoff}
        selection={selection}
        finalists={finalists}
        onSelect={onSelect}
      />
      {firstRound && (
        <SwingCard
          firstRound={firstRound}
          runoff={runoff}
          selection={selection}
          finalists={finalists}
          place={place}
          onSelect={onSelect}
        />
      )}
      {vs2022 && <Compare2022Card view={vs2022} place={place} onSelect={onSelect} />}
    </div>
  );
}
