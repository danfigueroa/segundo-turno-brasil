import { useMemo } from 'react';
import { useResults } from './api/use-results';
import { BrazilMap } from './features/map/BrazilMap';
import { Scoreboard } from './features/scoreboard/Scoreboard';
import { ScopePicker } from './features/scope-picker/ScopePicker';
import { StateSheet } from './features/state-sheet/StateSheet';
import { StatesTable } from './features/states-table/StatesTable';
import { LiveBadge } from './features/status/LiveBadge';
import { UpdateStatus } from './features/status/UpdateStatus';
import { Footer } from './layout/Footer';
import { Header } from './layout/Header';
import { finalistsOf } from './lib/finalists';
import { COUNTRY, resolveTally, selectionTitle } from './lib/selection';
import { useSelection } from './lib/use-selection';
import styles from './App.module.css';

export function App() {
  const { data, isPending, isError, refetch } = useResults();
  const [selection, select] = useSelection();
  const finalists = useMemo(() => (data ? finalistsOf(data.country) : []), [data]);

  if (isPending) {
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

  const tally = resolveTally(data, selection);
  const title = selectionTitle(selection);

  return (
    <>
      <Header>
        <LiveBadge country={data.country} />
      </Header>
      <main className={styles.layout}>
        <div className={styles.summary}>
          <Scoreboard title={title} tally={tally} finalists={finalists} />
          <ScopePicker selection={selection} onSelect={select} />
          <UpdateStatus data={data} />
        </div>
        <div className={styles.detail}>
          <BrazilMap data={data} finalists={finalists} selection={selection} onSelect={select} />
          <StatesTable data={data} finalists={finalists} selection={selection} onSelect={select} />
        </div>
      </main>
      <Footer />
      <StateSheet
        title={selection.kind === 'state' ? title : undefined}
        tally={selection.kind === 'state' ? tally : undefined}
        finalists={finalists}
        onClose={() => select(COUNTRY)}
      />
    </>
  );
}
