import { STATES, type Round } from '@stb/domain';
import { useQuery } from '@tanstack/react-query';
import { lazy, Suspense, useEffect, useMemo, useRef } from 'react';
import { useAbroad } from './api/abroad';
import { useCities } from './api/cities';
import { useResults } from './api/use-results';
import { RunoffCountdown } from './features/countdown/RunoffCountdown';
import { BrazilMap } from './features/map/BrazilMap';
import { ResultCard } from './features/result-card/ResultCard';
import { RoundTabs } from './features/round-tabs/RoundTabs';
import { ScopeChips } from './features/scope-chips/ScopeChips';
import { ShareButton } from './features/share/ShareButton';
import { shareContentFrom } from './features/share/share-content';
import { loadStateMap } from './features/state-map/state-maps';
import { loadContinentMap } from './features/world-map/continent-maps';
import { StatesList } from './features/states-list/StatesList';
import { PinButton } from './features/my-place/PinButton';
import { LiveBadge } from './features/status/LiveBadge';
import { StaleWarning, UpdateNote } from './features/status/UpdateStatus';
import { useI18n } from './i18n/i18n-context';
import type { I18n } from './i18n/i18n';
import { Footer } from './layout/Footer';
import { Header } from './layout/Header';
import { LoadingScreen } from './layout/LoadingScreen';
import { documentTitle } from './lib/document-title';
import { fullSiteUrl, isEmbed } from './lib/embed';
import { finalistsOf, type Finalist } from './lib/finalists';
import { isPinnable, useMyPlace } from './lib/my-place';
import {
  countryOf,
  isAbroad,
  resolveTally,
  selectionTitle,
  stateOf,
  type Countries,
  type Municipalities,
  type Selection,
} from './lib/selection';
import { SITE_HOST } from './lib/site';
import { useMediaQuery } from './lib/use-media-query';
import { useView } from './lib/use-view';
import { resolveRound } from './lib/view';
import { winnerOf } from './lib/winner';
import styles from './App.module.css';

/** What the share button names: "Compartilhar Bahia". */
function shareLabel(
  selection: Selection,
  i18n: I18n,
  cities: Municipalities,
  countries: Countries,
  winner: Finalist | undefined,
): string {
  switch (selection.kind) {
    case 'country':
      return winner ? `Compartilhar a vitória de ${winner.shortName}` : 'Compartilhar resultado';
    case 'region':
      return `Compartilhar ${i18n.m.places.regions[selection.code]}`;
    case 'state':
      return `Compartilhar ${STATES[selection.code].name}`;
    case 'abroad':
      return `Compartilhar ${i18n.m.places.abroad}`;
    case 'city':
    case 'abroadCountry':
      return `Compartilhar ${selectionTitle(selection, i18n, cities, countries)}`;
  }
}

// Below the scoreboard and the map: loaded after the first paint (ADR 0005).
const Insights = lazy(() => import('./features/insights/Insights'));
// Only drawn while abroad is selected, so its geometry stays out of the first load.
const WorldMap = lazy(() => import('./features/world-map/WorldMap'));
// Only drawn while a state or city is selected, with its state's municipal map.
const StateMap = lazy(() => import('./features/state-map/StateMap'));
// The lists of a state's cities and of the countries abroad: only with that scope open.
const CitiesList = lazy(() =>
  import('./features/cities/CitiesList').then((module) => ({ default: module.CitiesList })),
);
const CountriesList = lazy(() =>
  import('./features/countries/CountriesList').then((module) => ({
    default: module.CountriesList,
  })),
);

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function App() {
  const i18n = useI18n();
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
    enabled: isAbroad(view.selection) && !waitingForDefault,
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
  // The continent of the selected country abroad, shared with the map's cache, to share it.
  const continent = countryOf(view.selection, abroad.data?.countries)?.continent;
  const continentMap = useQuery({
    queryKey: ['continent-map', continent],
    queryFn: () =>
      continent ? loadContinentMap(continent) : Promise.reject(new Error('No country selected')),
    enabled: continent !== undefined,
    staleTime: Infinity,
  });
  const resultRef = useRef<HTMLElement>(null);
  const [myPlace, setMyPlace] = useMyPlace();
  // Wide screens put the round tabs in the header; phones give them a row of their own.
  const wide = useMediaQuery('(min-width: 960px)');

  const finalists = useMemo(() => (data ? finalistsOf(data.country) : []), [data]);
  // The score of the scope on screen in the tab title, for a tab left in the background.
  const tabTitle = data
    ? documentTitle(
        resolveTally(data, view.selection, cities.data?.cities, abroad.data?.countries),
        finalists,
        view.selection.kind === 'country'
          ? undefined
          : selectionTitle(view.selection, i18n, cities.data?.cities, abroad.data?.countries),
        i18n,
      )
    : i18n.m.site.title;
  useEffect(() => {
    document.title = tabTitle;
  }, [tabTitle]);
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

  if (waitingForDefault || isPending) return <LoadingScreen />;

  if (isError && !data) {
    return (
      <>
        <Header />
        <main className={styles.message}>
          <p>{i18n.m.site.error}</p>
          <button type="button" className={styles.retry} onClick={() => void refetch()}>
            {i18n.m.site.retry}
          </button>
        </main>
      </>
    );
  }

  const { selection } = view;
  // Before the runoff count starts there is nothing to break down by scope.
  const waiting = data.round === 2 && data.country.sections.counted === 0;

  // Embedded in another site: only the result (or the countdown) and a link to the site.
  if (isEmbed()) {
    return (
      <main className={styles.embed}>
        {waiting ? (
          <RunoffCountdown finalists={finalists} onShowFirstRound={() => changeRound(1)} />
        ) : (
          <ResultCard
            data={data}
            selection={selection}
            finalists={finalists}
            onSelect={select}
            countries={abroad.data?.countries}
            cities={cities.data?.cities}
          >
            <a
              className={styles.embedLink}
              href={fullSiteUrl()}
              target="_blank"
              rel="noopener noreferrer"
            >
              {i18n.m.site.follow(SITE_HOST)}
            </a>
          </ResultCard>
        )}
      </main>
    );
  }
  const detail =
    cities.data && stateMap.data ? { cities: cities.data.cities, map: stateMap.data } : undefined;
  const abroadDetail = abroad.data && { countries: abroad.data.countries, map: continentMap.data };
  const getShareContent = () =>
    shareContentFrom(data, selection, finalists, i18n, SITE_HOST, detail, abroadDetail);

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
      {!waiting && <ScopeChips selection={selection} onSelect={select} myPlace={myPlace} />}

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
                selection={selection}
                label={shareLabel(
                  selection,
                  i18n,
                  cities.data?.cities,
                  abroad.data?.countries,
                  winnerOf(data, finalists),
                )}
              />
              {/* A city or a country is named only once its breakdown is loaded. */}
              {isPinnable(selection) &&
                (selection.kind === 'state' ||
                  (selection.kind === 'city' && cities.data) ||
                  (selection.kind === 'abroadCountry' && abroad.data)) && (
                  <PinButton
                    selection={selection}
                    label={selectionTitle(
                      selection,
                      i18n,
                      cities.data?.cities,
                      abroad.data?.countries,
                    )}
                    place={myPlace}
                    onChange={setMyPlace}
                  />
                )}
            </ResultCard>
          )}
          {isAbroad(selection) ? (
            <Suspense fallback={null}>
              <WorldMap
                abroad={abroad.data}
                finalists={finalists}
                selection={selection}
                onSelect={select}
              />
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
        {/* No count analysis for a city or a country abroad: no history at that level. */}
        {!waiting &&
          runoff.data &&
          selection.kind !== 'city' &&
          selection.kind !== 'abroadCountry' && (
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
          <Suspense fallback={null}>
            <CitiesList
              uf={uf}
              selection={selection}
              cities={cities.data?.cities}
              failed={cities.isError}
              finalists={finalists}
              onSelect={select}
            />
          </Suspense>
        )}
        {!waiting && !uf && !isAbroad(selection) && (
          <StatesList data={data} finalists={finalists} selection={selection} onSelect={select} />
        )}
        {!waiting && isAbroad(selection) && (
          <Suspense fallback={null}>
            <CountriesList
              data={data}
              abroad={abroad.data}
              failed={abroad.isError}
              finalists={finalists}
              selection={selection}
              onSelect={select}
            />
          </Suspense>
        )}
      </main>

      <Footer>
        <UpdateNote data={data} />
      </Footer>
    </>
  );
}
