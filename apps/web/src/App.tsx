import { REGION_NAMES, STATES, type Round } from '@stb/domain';
import { useQuery } from '@tanstack/react-query';
import { lazy, Suspense, useMemo, useRef } from 'react';
import { useAbroad } from './api/abroad';
import { useCities } from './api/cities';
import { useResults } from './api/use-results';
import { RunoffCountdown } from './features/countdown/RunoffCountdown';
import { CitiesList } from './features/cities/CitiesList';
import { CountriesList } from './features/countries/CountriesList';
import { BrazilMap } from './features/map/BrazilMap';
import { ResultCard } from './features/result-card/ResultCard';
import { RoundTabs } from './features/round-tabs/RoundTabs';
import { ScopeChips } from './features/scope-chips/ScopeChips';
import { ShareButton } from './features/share/ShareButton';
import { shareContentFrom } from './features/share/share-content';
import { loadStateMap } from './features/state-map/state-maps';
import { StatesList } from './features/states-list/StatesList';
import { LiveBadge } from './features/status/LiveBadge';
import { StaleWarning, UpdateNote } from './features/status/UpdateStatus';
import { Footer } from './layout/Footer';
import { Header } from './layout/Header';
import { finalistsOf } from './lib/finalists';
import { selectionTitle, stateOf, type Municipalities, type Selection } from './lib/selection';
import { useMediaQuery } from './lib/use-media-query';
import { useView } from './lib/use-view';
import { resolveRound } from './lib/view';
import styles from './App.module.css';

/** What the share button names: "Compartilhar Bahia". */
function shareLabel(selection: Selection, cities: Municipalities): string {
  switch (selection.kind) {
    case 'country':
      return 'Compartilhar resultado';
    case 'region':
      return `Compartilhar ${REGION_NAMES[selection.code]}`;
    case 'state':
      return `Compartilhar ${STATES[selection.code].name}`;
    case 'abroad':
      return 'Compartilhar Exterior';
    case 'city':
      return `Compartilhar ${selectionTitle(selection, cities)}`;
  }
}

// Below the scoreboard and the map: loaded after the first paint (ADR 0005).
const Insights = lazy(() => import('./features/insights/Insights'));
// Only drawn while abroad is selected, so its geometry stays out of the first load.
const WorldMap = lazy(() => import('./features/world-map/WorldMap'));
// Only drawn while a state or city is selected, with its state's municipal map.
const StateMap = lazy(() => import('./features/state-map/StateMap'));

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function App() {
  const [view, navigate] = useView();
  // The runoff is always loaded: it is the live data and decides the default round.
  const runoff = useResults(2);
  const waitingForDefault = view.round === undefined && runoff.isPending;
  const round = resolveRound(view.round, runoff.data);
  const runoffStarted = (runoff.data?.country.sections.counted ?? 0) > 0;
  // The first round is also compared with the runoff once its count starts.
  const firstRound = useResults(1, {
    enabled: !waitingForDefault && (round === 1 || runoffStarted),
  });
  const { data, isPending, isError, refetch } = round === 1 ? firstRound : runoff;
  // The breakdown by country is heavier and only needed while abroad is on screen.
  const abroad = useAbroad(round, {
    enabled: view.selection.kind === 'abroad' && !waitingForDefault,
  });
  // Municipalities and their map: only for the state (or city) on screen.
  const uf = stateOf(view.selection);
  const cities = useCities(round, uf, { enabled: !waitingForDefault });
  const stateMap = useQuery({
    queryKey: ['state-map', uf],
    queryFn: () => (uf ? loadStateMap(uf) : Promise.reject(new Error('No state selected'))),
    enabled: uf !== undefined,
    staleTime: Infinity,
  });
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
  const detail =
    cities.data && stateMap.data ? { cities: cities.data.cities, map: stateMap.data } : undefined;
  const getShareContent = () =>
    shareContentFrom(data, selection, finalists, window.location.host, detail);

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
              countries={abroad.data?.countries}
              cities={cities.data?.cities}
            >
              <ShareButton
                getContent={getShareContent}
                label={shareLabel(selection, cities.data?.cities)}
              />
            </ResultCard>
          )}
          {selection.kind === 'abroad' ? (
            <Suspense fallback={null}>
              <WorldMap abroad={abroad.data} finalists={finalists} onSelect={select} />
            </Suspense>
          ) : uf ? (
            <Suspense fallback={null}>
              <StateMap
                uf={uf}
                map={stateMap.data}
                selection={selection}
                cities={cities.data?.cities}
                finalists={finalists}
                onSelect={select}
              />
            </Suspense>
          ) : (
            <BrazilMap data={data} finalists={finalists} selection={selection} onSelect={select} />
          )}
        </div>
        {!waiting && runoff.data && selection.kind !== 'city' && (
          <Suspense fallback={null}>
            <Insights
              round={round}
              runoff={runoff.data}
              firstRound={firstRound.data}
              selection={selection}
              finalists={finalists}
              onSelect={select}
            />
          </Suspense>
        )}
        {!waiting && uf && (
          <CitiesList
            uf={uf}
            selection={selection}
            cities={cities.data?.cities}
            failed={cities.isError}
            finalists={finalists}
            onSelect={select}
          />
        )}
        {!waiting && !uf && selection.kind !== 'abroad' && (
          <StatesList data={data} finalists={finalists} selection={selection} onSelect={select} />
        )}
        {!waiting && selection.kind === 'abroad' && (
          <CountriesList
            data={data}
            abroad={abroad.data}
            failed={abroad.isError}
            finalists={finalists}
          />
        )}
      </main>

      <Footer>
        <UpdateNote data={data} />
      </Footer>
    </>
  );
}
