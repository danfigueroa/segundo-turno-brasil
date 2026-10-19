import type { ContinentCode, RegionCode } from '@stb/domain';
import type { Units } from '../format';

/**
 * Every text of the site in Brazilian Portuguese: the source the other languages
 * translate, key by key ({@link Messages}). Texts with numbers or names are functions.
 */
export const ptBR = {
  places: {
    brazil: 'Brasil',
    /** Votes cast abroad: clearer than "Exterior" for votes cast in other countries. */
    abroad: 'Outros países',
    /** A region as a scope: "Região Nordeste". */
    region: (name: string) => `Região ${name}`,
    regions: {
      N: 'Norte',
      NE: 'Nordeste',
      CO: 'Centro-Oeste',
      SE: 'Sudeste',
      S: 'Sul',
    } satisfies Record<RegionCode, string>,
    continents: {
      AM: 'Américas',
      EU: 'Europa',
      AS: 'Ásia e Oceania',
      AF: 'África',
    } satisfies Record<ContinentCode, string>,
  },
  /** Words used across the site. */
  common: {
    /** Share of sections counted: "87,40% apurado". */
    counted: (percent: string) => `${percent} apurado`,
    /** "87,40% das seções apuradas". */
    sectionsCounted: (percent: string) => `${percent} das seções apuradas`,
    noVotes: 'Sem votos apurados',
    /** `1 voto`, `1.234 votos`: the count comes formatted. */
    votes: (count: number, formatted: string) =>
      count === 1 ? `${formatted} voto` : `${formatted} votos`,
    tie: 'empate',
  },
  /** Brand, loading and errors. */
  site: {
    /** The brand: a name, the same in every language. */
    name: 'Segundo Turno',
    subtitle: 'Eleição presidencial 2026',
    subtitleWide: ' · apuração em tempo real',
    /** Tab title before any vote is counted (`index.html` has the pt-BR one). */
    title: 'Segundo Turno 2026 · Apuração ao vivo',
    loading: 'Carregando resultados…',
    error: 'Não foi possível carregar os resultados agora.',
    retry: 'Tentar novamente',
    credit: 'Desenvolvido por',
    /** Link from the embed to the full site. */
    follow: (host: string) => `Acompanhe ao vivo em ${host}`,
  },
  /** Count status, staleness and the footer note. */
  status: {
    live: 'Ao vivo',
    waiting: 'Aguardando',
    finished: 'Apuração encerrada',
    /** The first round, always final. */
    final: 'Resultado final',
    stale: (time: string) => `O TSE não respondeu agora. Mostrando os dados de ${time}.`,
    finalAt: (date: string, time: string) => `Resultado final, totalizado em ${date} às ${time}`,
    updatedAt: (time: string) => `Atualizado às ${time}`,
    source: '(horário de Brasília) · Fonte: TSE',
  },
  units: { points: 'p.p.' } satisfies Units,
};

/** The shape every language's texts must have. */
export type Messages = typeof ptBR;
