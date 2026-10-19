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
  units: { points: 'Pp.' },
};

export default messages;
