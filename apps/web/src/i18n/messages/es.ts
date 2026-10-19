import type { Messages } from './pt-BR';

/** Spanish. */
const messages: Messages = {
  places: {
    brazil: 'Brasil',
    abroad: 'Otros países',
    region: (name: string) => `Región ${name}`,
    regions: { N: 'Norte', NE: 'Nordeste', CO: 'Centro-Oeste', SE: 'Sudeste', S: 'Sur' },
    continents: { AM: 'Américas', EU: 'Europa', AS: 'Asia y Oceanía', AF: 'África' },
  },
  common: {
    counted: (percent: string) => `${percent} escrutado`,
    sectionsCounted: (percent: string) => `${percent} de las urnas escrutadas`,
    noVotes: 'Sin votos escrutados',
    votes: (count: number, formatted: string) =>
      count === 1 ? `${formatted} voto` : `${formatted} votos`,
    tie: 'empate',
  },
  site: {
    name: 'Segundo Turno',
    subtitle: 'Elección presidencial 2026',
    subtitleWide: ' · escrutinio en tiempo real',
    title: 'Segundo Turno 2026 · Escrutinio en vivo',
    loading: 'Cargando resultados…',
    error: 'No se pudieron cargar los resultados ahora.',
    retry: 'Intentar de nuevo',
    credit: 'Desarrollado por',
    follow: (host: string) => `Síguelo en vivo en ${host}`,
  },
  status: {
    live: 'En vivo',
    waiting: 'En espera',
    finished: 'Escrutinio terminado',
    final: 'Resultado final',
    stale: (time: string) => `El TSE no responde ahora. Mostrando los datos de las ${time}.`,
    finalAt: (date: string, time: string) => `Resultado final, totalizado el ${date} a las ${time}`,
    updatedAt: (time: string) => `Actualizado a las ${time}`,
    source: '(hora de Brasilia) · Fuente: TSE',
  },
  units: { points: 'p.p.' },
};

export default messages;
