import type { Round } from '@stb/domain';
import { useMemo } from 'react';
import { useResults } from './api/use-results';
import { BrazilMap } from './features/map/BrazilMap';
import { RoundTabs } from './features/round-tabs/RoundTabs';
import { Scoreboard } from './features/scoreboard/Scoreboard';
import { ScopePicker } from './features/scope-picker/ScopePicker';
import { ShareButton } from './features/share/ShareButton';
import { shareContentFrom } from './features/share/share-content';
import { StateSheet } from './features/state-sheet/StateSheet';
import { StatesTable } from './features/states-table/StatesTable';
import { LiveBadge } from './features/status/LiveBadge';
import { UpdateStatus } from './features/status/UpdateStatus';
import { Footer } from './layout/Footer';
import { Header } from './layout/Header';
import { finalistsOf } from './lib/finalists';
import { COUNTRY, resolveTally, selectionTitle, type Selection } from './lib/selection';
import { useView } from './lib/use-view';
import { resolveRound } from './lib/view';
import styles from './App.module.css';

export function App() {
  const [view, navigate] = useView();
  // The runoff is always loaded: it is the live data and decides the default round.
  const runoff = useResults(2);
  const waitingForDefault = view.round === undefined && runoff.isPending;
  const round = resolveRound(view.round, runoff.data);
  const firstRound = useResults(1, { enabled: round === 1 && !waitingForDefault });
  const { data, isPending, isError, refetch } = round === 1 ? firstRound : runoff;

  const finalists = useMemo(() => (data ? finalistsOf(data.country) : []), [data]);
  const select = (selection: Selection) => navigate({ round: view.round, selection });
  const changeRound = (next: Round) => navigate({ round: next, selection: view.selection });

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
  const tally = resolveTally(data, selection);
  const title = selectionTitle(selection);
  // States and abroad open the bottom sheet on mobile, keeping the map in view.
  const sheetOpen = selection.kind === 'state' || selection.kind === 'abroad';
  const getShareContent = () => shareContentFrom(data, selection, finalists, window.location.host);

  return (
    <>
      <Header>
        <LiveBadge round={round} country={data.country} />
      </Header>
      <main className={styles.layout}>
        <div className={styles.summary}>
          <RoundTabs round={round} onChange={changeRound} />
          <Scoreboard title={title} tally={tally} finalists={finalists} />
          <ShareButton getContent={getShareContent} variant="desktop" />
          <ScopePicker selection={selection} onSelect={select} />
          <UpdateStatus data={data} onShowFirstRound={() => changeRound(1)} />
        </div>
        <div className={styles.detail}>
          <BrazilMap data={data} finalists={finalists} selection={selection} onSelect={select} />
          <StatesTable data={data} finalists={finalists} selection={selection} onSelect={select} />
        </div>
      </main>
      <Footer />
      <ShareButton getContent={getShareContent} variant="floating" hidden={sheetOpen} />
      <StateSheet
        title={sheetOpen ? title : undefined}
        tally={sheetOpen ? tally : undefined}
        finalists={finalists}
        onClose={() => select(COUNTRY)}
      >
        <ShareButton getContent={getShareContent} variant="inline" />
      </StateSheet>
    </>
  );
}
