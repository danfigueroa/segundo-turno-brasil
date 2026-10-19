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
  units: { points: 'p.p.' },
};

export default messages;
