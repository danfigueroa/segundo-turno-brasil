import type { Messages } from './pt-BR';

/** Italian. */
const messages: Messages = {
  places: {
    brazil: 'Brasile',
    abroad: 'Altri paesi',
    region: (name: string) => `Regione ${name}`,
    regions: { N: 'Nord', NE: 'Nord-Est', CO: 'Centro-Ovest', SE: 'Sud-Est', S: 'Sud' },
    continents: { AM: 'Americhe', EU: 'Europa', AS: 'Asia e Oceania', AF: 'Africa' },
  },
  common: {
    counted: (percent: string) => `${percent} scrutinato`,
    sectionsCounted: (percent: string) => `${percent} delle sezioni scrutinate`,
    noVotes: 'Nessun voto scrutinato',
    votes: (count: number, formatted: string) =>
      count === 1 ? `${formatted} voto` : `${formatted} voti`,
    tie: 'pareggio',
  },
  site: {
    name: 'Segundo Turno',
    subtitle: 'Elezioni presidenziali 2026',
    subtitleWide: ' · spoglio in tempo reale',
    title: 'Segundo Turno 2026 · Spoglio in diretta',
    loading: 'Caricamento dei risultati…',
    error: 'Impossibile caricare i risultati in questo momento.',
    retry: 'Riprova',
    credit: 'Sviluppato da',
    follow: (host: string) => `Seguilo in diretta su ${host}`,
  },
  status: {
    live: 'In diretta',
    waiting: 'In attesa',
    finished: 'Spoglio concluso',
    final: 'Risultato finale',
    stale: (time: string) => `Il TSE non risponde in questo momento. Dati delle ${time}.`,
    finalAt: (date: string, time: string) =>
      `Risultato finale, totalizzato il ${date} alle ${time}`,
    updatedAt: (time: string) => `Aggiornato alle ${time}`,
    source: '(ora di Brasília) · Fonte: TSE',
  },
  round: {
    tabs: 'Turno elettorale',
    labels: { 1: '1° turno', 2: 'Ballottaggio' },
  },
  result: {
    crumbs: 'Sei qui',
    president: 'Presidente',
    abroadVotes: 'voti dei brasiliani all’estero',
    regionVotes: 'voti nella regione',
    leads: 'In testa',
    mostVoted: 'Più votato',
    half: '50% dei voti validi',
    difference: 'Distacco',
    ahead: (name: string) => `${name} in vantaggio`,
    sections: 'Sezioni scrutinate',
    outOf: (part: string, whole: string) => `${part} su ${whole}`,
    abstention: 'Astensione',
    others: 'Altri candidati',
    countriesWithVotes: 'Paesi con voti',
    validVotes: 'Voti validi',
    ofTurnout: (percent: string) => `${percent} dei votanti`,
    turnout: 'Affluenza',
    voters: (count: string) => `${count} elettori`,
    blankAndNull: 'Schede bianche e nulle',
    statesWon: (count: number) =>
      count === 1 ? 'Ha vinto in 1 stato' : `Ha vinto in ${count} stati`,
    statesLed: (count: number) =>
      count === 1 ? 'In testa in 1 stato' : `In testa in ${count} stati`,
  },
  map: {
    leadByState: 'Chi è in testa in ogni stato',
    abstentionByState: 'Astensione in ogni stato',
    statesFill: 'Gli stati si colorano man mano che le schede vengono scrutinate.',
    clickState: (abroad: string) => `Clicca su uno stato o su ${abroad}.`,
    tapState: (abroad: string) => `Tocca uno stato o ${abroad} per vedere il risultato.`,
    modes: 'Mostra sulla mappa',
    lead: 'Chi è in testa',
    abstention: 'Astensione',
    states: 'Stati',
    noVotes: 'nessun voto scrutinato',
    leadsWith: (name: string, share: string) => `${name} in testa con il ${share}`,
    abstentionOf: (share: string) => `astensione del ${share}`,
    goToState: 'Vai a uno stato',
    pickState: 'Oppure scegli uno stato',
    allStates: 'Tutti gli stati',
    legendLead: 'Vantaggio di chi è in testa (punti percentuali)',
    noVotesOrTie: 'Nessun voto scrutinato o pareggio',
    legendAbstention: 'Astensione nelle sezioni scrutinate (%)',
    leadByCity: 'Chi è in testa in ogni città',
    citiesFill: (state: string) =>
      `I comuni di ${state} si colorano man mano che le schede vengono scrutinate.`,
    clickCity: 'Clicca su una città per vedere il risultato.',
    tapCity: 'Tocca una città per vedere il risultato.',
    citiesOf: (state: string) => `Mappa dei comuni di ${state}`,
    goToCity: 'Vai a una città',
    pickCity: 'Oppure scegli una città',
    allCities: 'Tutte le città',
    loadingCities: 'Caricamento delle città…',
    leadByCountry: 'Chi è in testa in ogni paese',
    countriesFill:
      'I paesi con seggi elettorali si colorano man mano che le schede vengono scrutinate.',
    clickCountry:
      'Clicca su un paese per vedere il risultato. Quelli senza seggi elettorali restano in grigio chiaro.',
    tapCountry:
      'Tocca un paese per vedere il risultato. Quelli senza seggi elettorali restano in grigio chiaro.',
    continents: 'Continente della mappa',
    leadsInCountries: (name: string, count: number) =>
      `${name} in testa in ${count === 1 ? '1 paese' : `${count} paesi`}`,
    mapOf: (place: string) => `Mappa: ${place}`,
    backToBrazil: 'Torna al Brasile',
  },
  myPlace: {
    pin: {
      state: 'Fissa come il mio stato',
      city: 'Fissa come la mia città',
      country: 'Fissa come il mio paese',
    },
    pinned: {
      state: 'Fissato come il mio stato',
      city: 'Fissata come la mia città',
      country: 'Fissato come il mio paese',
    },
    chips: 'Vedi il risultato di',
  },
  units: { points: 'p.p.' },
};

export default messages;
