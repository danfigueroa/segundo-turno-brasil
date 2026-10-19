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
  /** The two rounds. */
  round: {
    tabs: 'Turno da eleição',
    labels: { 1: '1º turno', 2: '2º turno' },
  },
  /** The result card. */
  result: {
    crumbs: 'Você está em',
    president: 'Presidente',
    abroadVotes: 'votos de brasileiros no exterior',
    regionVotes: 'votos na região',
    leads: 'Lidera',
    mostVoted: 'Mais votado',
    /** The 50% marker of the vote bar. */
    half: '50% dos votos válidos',
    difference: 'Diferença',
    /** Margin note in a state or a city: "Lula à frente". */
    ahead: (name: string) => `${name} à frente`,
    sections: 'Seções apuradas',
    /** Sections counted out of all: "50 de 100". */
    outOf: (part: string, whole: string) => `${part} de ${whole}`,
    abstention: 'Abstenção',
    others: 'Demais candidatos',
    countriesWithVotes: 'Países com votos',
    validVotes: 'Votos válidos',
    ofTurnout: (percent: string) => `${percent} do comparecimento`,
    turnout: 'Comparecimento',
    voters: (count: string) => `${count} eleitores`,
    blankAndNull: 'Brancos e nulos',
    /** States a finalist won in a region, or leads in while counting. */
    statesWon: (count: number) =>
      count === 1 ? 'Venceu em 1 estado' : `Venceu em ${count} estados`,
    statesLed: (count: number) =>
      count === 1 ? 'Lidera em 1 estado' : `Lidera em ${count} estados`,
  },
  /** The maps of Brazil, of a state and of a continent. */
  map: {
    leadByState: 'Quem lidera em cada estado',
    abstentionByState: 'Abstenção em cada estado',
    statesFill: 'Os estados ganham cor conforme as urnas são apuradas.',
    clickState: (abroad: string) => `Clique em um estado ou em ${abroad}.`,
    tapState: (abroad: string) => `Toque em um estado ou em ${abroad} para ver o resultado.`,
    modes: 'Mostrar no mapa',
    lead: 'Quem lidera',
    abstention: 'Abstenção',
    states: 'Estados',
    /** What a state's label says, after its name. */
    noVotes: 'sem votos apurados',
    leadsWith: (name: string, share: string) => `${name} lidera com ${share}`,
    abstentionOf: (share: string) => `abstenção de ${share}`,
    goToState: 'Ir para um estado',
    pickState: 'Ou escolha um estado',
    allStates: 'Todos os estados',
    legendLead: 'Vantagem de quem lidera (pontos percentuais)',
    noVotesOrTie: 'Sem votos apurados ou empate',
    legendAbstention: 'Abstenção nas seções apuradas (%)',
    leadByCity: 'Quem lidera em cada cidade',
    citiesFill: (state: string) =>
      `Os municípios de ${state} ganham cor conforme as urnas são apuradas.`,
    clickCity: 'Clique em uma cidade para ver o resultado.',
    tapCity: 'Toque em uma cidade para ver o resultado.',
    citiesOf: (state: string) => `Mapa dos municípios de ${state}`,
    goToCity: 'Ir para uma cidade',
    pickCity: 'Ou escolha uma cidade',
    allCities: 'Todas as cidades',
    loadingCities: 'Carregando cidades…',
    leadByCountry: 'Quem lidera em cada país',
    countriesFill: 'Os países com seção eleitoral ganham cor conforme as urnas são apuradas.',
    clickCountry:
      'Clique em um país para ver o resultado. Os sem seção eleitoral ficam em cinza claro.',
    tapCountry:
      'Toque em um país para ver o resultado. Os sem seção eleitoral ficam em cinza claro.',
    continents: 'Continente do mapa',
    leadsInCountries: (name: string, count: number) =>
      `${name} lidera em ${count === 1 ? '1 país' : `${count} países`}`,
    mapOf: (place: string) => `Mapa: ${place}`,
    backToBrazil: 'Voltar ao Brasil',
  },
  /** The place a viewer pins as theirs. */
  myPlace: {
    pin: {
      state: 'Fixar como meu estado',
      city: 'Fixar como minha cidade',
      country: 'Fixar como meu país',
    },
    pinned: {
      state: 'Fixado como meu estado',
      city: 'Fixado como minha cidade',
      country: 'Fixado como meu país',
    },
    /** The scope bar. */
    chips: 'Ver resultado de',
  },
  /** The lists by state, city and country. */
  lists: {
    byState: 'Resultado por estado',
    clickState: 'Clique em uma linha para ver os detalhes do estado.',
    tapState: 'Toque em um estado para ver os detalhes.',
    regionStates: 'Estados da região',
    regionStatesOf: (region: string) => `Estados da região ${region}`,
    otherStates: (region: string) => `Outros estados do ${region}`,
    leadInPoints: 'Vantagem em pontos percentuais.',
    differenceInPoints: 'Diferença em pontos percentuais.',
    state: 'Estado',
    distribution: 'Distribuição',
    lead: 'Vantagem',
    noVotes: 'Sem votos',
    showLess: 'Mostrar menos',
    showStates: (count: number) => `Mostrar os ${count} estados`,
    seeStates: (count: number) => `Ver os ${count} estados`,
    byCity: 'Votação por cidade',
    cities: (count: number) => (count === 1 ? '1 cidade' : `${count} cidades`),
    /** "Lula lidera em 120 cidades": the count comes from {@link cities}. */
    leadsIn: (name: string, places: string) => `${name} lidera em ${places}`,
    /** The leads by city, and out of how many: "…, de 417 cidades." */
    outOfCities: (leads: string, cities: string) => `${leads}, de ${cities}.`,
    citiesFill: (cities: string) => `${cities}. Elas ganham cor conforme as urnas são apuradas.`,
    citiesFailed: 'Não foi possível carregar a votação por cidade agora.',
    citiesLoading: 'Carregando a votação por cidade…',
    searchCity: (state: string) => `Buscar cidade em ${state}`,
    cityPlaceholder: 'Ex.: nome da cidade',
    sortCities: 'Ordenar cidades por',
    orders: {
      electorate: 'Maior eleitorado',
      margin: 'Maior vantagem',
      pending: 'Mais urnas a apurar',
    },
    totalWide: 'Total (2 cand.)',
    total: 'Votos nos 2 candidatos',
    noCity: 'Nenhuma cidade encontrada.',
    seeCities: (count: number) => `Ver todas as ${count} cidades`,
    byCountry: 'Votação por país',
    countries: (count: number) => (count === 1 ? '1 país' : `${count} países`),
    countriesFailed: 'Não foi possível carregar a votação por país agora.',
    countriesLoading: 'Carregando a votação por país…',
    searchCountry: 'Buscar país',
    countryPlaceholder: 'Ex.: Portugal, Japão…',
    continent: 'Continente',
    all: 'Todos',
    noCountry: 'Nenhum país encontrado.',
    seeCountries: (count: number) => `Ver todos os ${count} países`,
    /**
     * "Lula venceu em 64 países, Flávio em 36 e houve 1 empate (Guiné-Bissau)." The tied
     * countries come as one list.
     */
    abroadWins: (
      final: boolean,
      first: string,
      firstWins: number,
      second: string,
      secondWins: number,
      ties: number,
      tied: string,
    ) => {
      const firstPart = `${first} ${final ? 'venceu' : 'lidera'} em ${firstWins === 1 ? '1 país' : `${firstWins} países`}`;
      const secondPart = `${second} em ${secondWins}`;
      if (ties === 0) return `${firstPart} e ${secondPart}.`;
      return `${firstPart}, ${secondPart} e houve ${ties === 1 ? '1 empate' : `${ties} empates`} (${tied}).`;
    },
    abroadAbstention: (share: string) => `Abstenção no exterior: ${share}.`,
  },
  units: { points: 'p.p.' } satisfies Units,
};

/** The shape every language's texts must have. */
export type Messages = typeof ptBR;
