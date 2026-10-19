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
  units: { points: 'p.p.' },
};

export default messages;
