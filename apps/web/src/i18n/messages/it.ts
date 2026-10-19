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
  units: { points: 'p.p.' },
};

export default messages;
