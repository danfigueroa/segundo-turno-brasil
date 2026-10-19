import type { Messages } from './pt-BR';

/** French. */
const messages: Messages = {
  places: {
    brazil: 'Brésil',
    abroad: 'Autres pays',
    region: (name: string) => `Région ${name}`,
    regions: { N: 'Nord', NE: 'Nord-Est', CO: 'Centre-Ouest', SE: 'Sud-Est', S: 'Sud' },
    continents: { AM: 'Amériques', EU: 'Europe', AS: 'Asie et Océanie', AF: 'Afrique' },
  },
  common: {
    counted: (percent: string) => `${percent} dépouillé`,
    sectionsCounted: (percent: string) => `${percent} des bureaux de vote dépouillés`,
    noVotes: 'Aucun vote dépouillé',
    votes: (_count: number, formatted: string) => `${formatted} voix`,
    tie: 'égalité',
  },
  site: {
    name: 'Segundo Turno',
    subtitle: 'Élection présidentielle 2026',
    subtitleWide: ' · dépouillement en temps réel',
    title: 'Segundo Turno 2026 · Dépouillement en direct',
    loading: 'Chargement des résultats…',
    error: 'Impossible de charger les résultats pour le moment.',
    retry: 'Réessayer',
    credit: 'Développé par',
    follow: (host: string) => `Suivez en direct sur ${host}`,
  },
  status: {
    live: 'En direct',
    waiting: 'En attente',
    finished: 'Dépouillement terminé',
    final: 'Résultat final',
    stale: (time: string) => `Le TSE ne répond pas pour le moment. Données de ${time} affichées.`,
    finalAt: (date: string, time: string) => `Résultat final, totalisé le ${date} à ${time}`,
    updatedAt: (time: string) => `Mis à jour à ${time}`,
    source: '(heure de Brasília) · Source : TSE',
  },
  units: { points: 'pts' },
};

export default messages;
