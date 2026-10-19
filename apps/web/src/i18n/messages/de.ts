import type { Messages } from './pt-BR';

/** German. */
const messages: Messages = {
  places: {
    brazil: 'Brasilien',
    abroad: 'Andere Länder',
    region: (name: string) => `Region ${name}`,
    regions: { N: 'Norden', NE: 'Nordosten', CO: 'Mittelwesten', SE: 'Südosten', S: 'Süden' },
    continents: { AM: 'Amerika', EU: 'Europa', AS: 'Asien und Ozeanien', AF: 'Afrika' },
  },
  common: {
    counted: (percent: string) => `${percent} ausgezählt`,
    sectionsCounted: (percent: string) => `${percent} der Wahllokale ausgezählt`,
    noVotes: 'Keine Stimmen ausgezählt',
    votes: (count: number, formatted: string) =>
      count === 1 ? `${formatted} Stimme` : `${formatted} Stimmen`,
    tie: 'Gleichstand',
  },
  site: {
    name: 'Segundo Turno',
    subtitle: 'Präsidentschaftswahl 2026',
    subtitleWide: ' · Auszählung in Echtzeit',
    title: 'Segundo Turno 2026 · Auszählung live',
    loading: 'Ergebnisse werden geladen…',
    error: 'Die Ergebnisse konnten gerade nicht geladen werden.',
    retry: 'Erneut versuchen',
    credit: 'Entwickelt von',
    follow: (host: string) => `Live verfolgen auf ${host}`,
  },
  status: {
    live: 'Live',
    waiting: 'Warten',
    finished: 'Auszählung beendet',
    final: 'Endergebnis',
    stale: (time: string) => `Das TSE antwortet gerade nicht. Daten von ${time} Uhr.`,
    finalAt: (date: string, time: string) => `Endergebnis, ausgezählt am ${date} um ${time} Uhr`,
    updatedAt: (time: string) => `Aktualisiert um ${time} Uhr`,
    source: '(Ortszeit Brasília) · Quelle: TSE',
  },
  round: {
    tabs: 'Wahlgang',
    labels: { 1: '1. Wahlgang', 2: 'Stichwahl' },
  },
  result: {
    crumbs: 'Sie sind hier',
    president: 'Präsident',
    abroadVotes: 'Stimmen von Brasilianern im Ausland',
    regionVotes: 'Stimmen in der Region',
    leads: 'Führt',
    mostVoted: 'Meiste Stimmen',
    half: '50 % der gültigen Stimmen',
    difference: 'Abstand',
    ahead: (name: string) => `${name} vorn`,
    sections: 'Wahllokale ausgezählt',
    outOf: (part: string, whole: string) => `${part} von ${whole}`,
    abstention: 'Nichtwähler',
    others: 'Weitere Kandidaten',
    countriesWithVotes: 'Länder mit Stimmen',
    validVotes: 'Gültige Stimmen',
    ofTurnout: (percent: string) => `${percent} der Wählenden`,
    turnout: 'Wahlbeteiligung',
    voters: (count: string) => `${count} Wähler`,
    blankAndNull: 'Leer und ungültig',
    statesWon: (count: number) =>
      count === 1 ? 'Gewann 1 Bundesstaat' : `Gewann ${count} Bundesstaaten`,
    statesLed: (count: number) =>
      count === 1 ? 'Führt in 1 Bundesstaat' : `Führt in ${count} Bundesstaaten`,
  },
  units: { points: 'Pp.' },
};

export default messages;
