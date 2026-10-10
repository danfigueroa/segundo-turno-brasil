import { REGION_NAMES, STATES, type Round } from '@stb/domain';
import { useMemo, useRef } from 'react';
import { useResults } from './api/use-results';
import { RunoffCountdown } from './features/countdown/RunoffCountdown';
import { BrazilMap } from './features/map/BrazilMap';
import { ResultCard } from './features/result-card/ResultCard';
import { RoundTabs } from './features/round-tabs/RoundTabs';
import { ScopeChips } from './features/scope-chips/ScopeChips';
import { ShareButton } from './features/share/ShareButton';
import { shareContentFrom } from './features/share/share-content';
import { StatesList } from './features/states-list/StatesList';
import { LiveBadge } from './features/status/LiveBadge';
import { StaleWarning, UpdateNote } from './features/status/UpdateStatus';
import { Footer } from './layout/Footer';
import { Header } from './layout/Header';
import { finalistsOf } from './lib/finalists';
import type { Selection } from './lib/selection';
import { useMediaQuery } from './lib/use-media-query';
import { useView } from './lib/use-view';
import { resolveRound } from './lib/view';
import styles from './App.module.css';

/** What the share button names: "Compartilhar Bahia". */
function shareLabel(selection: Selection): string {
  switch (selection.kind) {
    case 'country':
      return 'Compartilhar resultado';
    case 'region':
      return `Compartilhar ${REGION_NAMES[selection.code]}`;
    case 'state':
      return `Compartilhar ${STATES[selection.code].name}`;
    case 'abroad':
      return 'Compartilhar Exterior';
  }
}

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function App() {
  const [view, navigate] = useView();
  // The runoff is always loaded: it is the live data and decides the default round.
  const runoff = useResults(2);
  const waitingForDefault = view.round === undefined && runoff.isPending;
  const round = resolveRound(view.round, runoff.data);
  const firstRound = useResults(1, { enabled: round === 1 && !waitingForDefault });
  const { data, isPending, isError, refetch } = round === 1 ? firstRound : runoff;
  const resultRef = useRef<HTMLElement>(null);
  // Wide screens put the round tabs in the header; phones give them a row of their own.
  const wide = useMediaQuery('(min-width: 960px)');

  const finalists = useMemo(() => (data ? finalistsOf(data.country) : []), [data]);
  const changeRound = (next: Round) => navigate({ round: next, selection: view.selection });
  /** Picking a scope anywhere brings its result into view (the map sits below it on phones). */
  const select = (selection: Selection) => {
    navigate({ round: view.round, selection });
    requestAnimationFrame(() =>
      resultRef.current?.scrollIntoView?.({
        block: 'nearest',
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      }),
    );
  };

  if (waitingForDefault || isPending) {
    return (
      <>
        <Header />
        <main className={styles.message} aria-busy="true">
          Carregando resultados…
        </main>
      </>
    );
  }

  if (isError && !data) {
    return (
      <>
        <Header />
        <main className={styles.message}>
          <p>Não foi possível carregar os resultados agora.</p>
          <button type="button" className={styles.retry} onClick={() => void refetch()}>
            Tentar novamente
          </button>
        </main>
      </>
    );
  }

  const { selection } = view;
  // Before the runoff count starts there is nothing to break down by scope.
  const waiting = data.round === 2 && data.country.sections.counted === 0;
  const getShareContent = () => shareContentFrom(data, selection, finalists, window.location.host);

  return (
    <>
      <Header>
        <LiveBadge round={round} country={data.country} />
        {wide && <RoundTabs round={round} onChange={changeRound} compact />}
      </Header>
      {!wide && (
        <div className={styles.mobileTabs}>
          <RoundTabs round={round} onChange={changeRound} />
        </div>
      )}
      {!waiting && <ScopeChips selection={selection} onSelect={select} />}

      <main className={styles.main}>
        <StaleWarning data={data} />
        <div className={styles.top}>
          {waiting ? (
            <div className={styles.column}>
              <RunoffCountdown finalists={finalists} onShowFirstRound={() => changeRound(1)} />
            </div>
          ) : (
            <ResultCard
              ref={resultRef}
              data={data}
              selection={selection}
              finalists={finalists}
              onSelect={select}
            >
              <ShareButton getContent={getShareContent} label={shareLabel(selection)} />
            </ResultCard>
          )}
          <BrazilMap data={data} finalists={finalists} selection={selection} onSelect={select} />
        </div>
        {!waiting && selection.kind !== 'abroad' && (
          <StatesList data={data} finalists={finalists} selection={selection} onSelect={select} />
        )}
      </main>

      <Footer>
        <UpdateNote data={data} />
      </Footer>
    </>
  );
}
