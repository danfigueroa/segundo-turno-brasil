# CLAUDE.md

Guia para o Claude Code (e qualquer pessoa contribuidora) trabalhar neste repositório.

## Visão geral

**Segundo Turno Brasil** é um site para acompanhar **ao vivo** a apuração do 2º turno da eleição presidencial brasileira de **25/10/2026**, com um mapa do Brasil interativo e animado que mostra o resultado no país, por região e por estado.

Princípios:

- **Leve e rápido**: bundle pequeno, payloads mínimos, mobile-first.
- **Claro**: qualquer pessoa entende o resultado em segundos.
- **Confiável sob pico**: o tráfego se concentra em uma única noite.
- **Acessível**: WCAG AA, sem depender só de cor.
- **Código de qualidade**: arquitetura limpa, tipagem estrita, testes.
- **Fiel ao design**: o desenho no Claude Design (https://claude.ai/artifact/QKqh5fDsjtfYyH7ZVGagxU) é a **fonte da verdade** visual — cores, tipografia, layout, textos e espaçamentos exatamente iguais, em celular e desktop. Não adicionar, remover nem "melhorar" elementos por conta própria; se uma regra deste arquivo conflitar com o design, vale o design (e este arquivo deve ser atualizado).

## Stack

| Camada     | Tecnologia                                                           |
| ---------- | -------------------------------------------------------------------- |
| Frontend   | React + Vite + TypeScript, TanStack Query, Schibsted Grotesk         |
| Backend    | Vercel Functions em TypeScript (Node 22), empacotadas com esbuild    |
| Contrato   | `zod/mini` compartilhado entre back e front (`zod` no adaptador TSE) |
| Hospedagem | Vercel (plano Hobby, gratuito)                                       |
| Monorepo   | pnpm workspaces                                                      |
| Qualidade  | ESLint, Prettier, Vitest, Testing Library                            |
| CI         | GitHub Actions                                                       |

> Por que não Go? O backend é um proxy fino cacheado pelo CDN: roda poucas vezes por minuto, então a performance da linguagem não faz diferença. TypeScript é o runtime de primeira classe na Vercel e permite **um único contrato de tipos** entre back e front.

## Arquitetura

```
Navegador (React SPA)
   │  polling ~20s
   ▼
CDN Vercel ── cache hit (< 15s) ──> resposta imediata
   │  cache expirado
   ▼
GET /api/results (Vercel Function, TypeScript)
   │  Cache-Control: public, s-maxage=15, stale-while-revalidate=30, stale-if-error=600
   ▼
resultados.tse.jus.br (JSON público do TSE)
```

- **Sem cron e sem banco de dados.** O CDN absorve o tráfego; a função só executa quando o cache expira. O próprio acesso dos usuários dispara a atualização.
- **Endpoint:** `GET /api/results?round=1|2` (padrão 2) — Brasil, exterior e as 27 UFs num único snapshot consistente (ver `docs/api.md` e ADR 0002). O 1º turno é final e fica 1h em cache. Regiões são agregadas no cliente com `aggregateRegion`.
- **Endpoint:** `GET /api/abroad?round=1|2` — votos no exterior **por país**, somando os 186 arquivos de cidade do TSE com a tabela cidade → país em `adapters/tse/abroad-cities.ts` (ADR 0008). Cache de 60s no 2º turno; buscado só com o Exterior aberto.
- **Planejado:** `GET /api/og` — imagem Open Graph (1200×630) com o placar atual, para link previews.
- **Falha do TSE:** a função serve o último snapshot bom com `stale: true` (cache de 5s) e `stale-if-error` cobre falhas da função; a UI exibe o horário dos dados.
- **Deploy:** `pnpm build` gera `.vercel/output` (Build Output API v3) via `scripts/build-vercel-output.mjs`. Nova função = registrar em `FUNCTIONS` nesse script (ADR 0003).

### Arquitetura limpa (ports & adapters)

```
apps/
  web/                    # React SPA — consome apenas packages/contracts e domain
    scripts/build-map.ts  # pré-projeta a malha do IBGE em caminhos SVG
    src/
      api/                # clientes /api/results e /api/abroad + polling (TanStack Query)
      lib/                # format, seleção (hash da URL), finalistas e faixas de margem
      components/         # peças genéricas (AnimatedNumber, ProgressBar)
      features/           # result-card, map, scope-chips, states-list, countries, countdown, status, share
      layout/
  api/
    src/
      ports/              # ResultsSource (interface)
      adapters/
        tse/              # schema zod do arquivo do TSE, mapper, TseResultsSource, loaders HTTP/fixture
        simulation/       # SimulatedResultsSource: replay "ao vivo" para desenvolvimento
      use-cases/          # GetResults (deduplicação + fallback stale)
      http/               # handler Fetch API + adaptador Node
      vercel/             # entradas das funções da Vercel
      config.ts           # variáveis de ambiente (zod)
      container.ts        # composition root
      dev-server.ts       # servidor local (porta 3001)
    test/fixtures/        # JSON reais do TSE (2026)
packages/
  domain/                 # entidades e regras puras (sem I/O)
  contracts/              # schema da API pública + tipos inferidos
scripts/                  # build da saída da Vercel
docs/                     # arquitetura, api, dados do TSE, frontend, adr/
```

Regras:

- Dependências apontam **para dentro**: `web`/`api` → `contracts`/`domain`. `domain` não importa nada externo.
- O front **nunca** conhece o formato do TSE; só o adaptador `tse` conhece.
- Todo dado externo é validado com `zod` na borda (adaptador) antes de virar entidade de domínio.
- TypeScript `strict`, sem `any`, sem `as` desnecessário; funções pequenas e puras sempre que possível.
- Código, identificadores e commits em **inglês**; textos da UI em **pt-BR**.

## Fonte de dados (TSE)

- Base: `https://resultados.tse.jus.br/oficial/`
- Configuração das eleições: `comum/config/ele-c.json` (lista códigos de eleição).
- Arquivo por abrangência: `{base}/ele2026/{eleição}/dados/{abr}/{abr}-c0001-e{eleição:06}-u.json` (`br`, `zz` = exterior, UFs em minúsculas). Detalhes em `docs/tse-data.md`.
- Códigos confirmados: **6258 = 2º turno presidencial de 2026** (`TSE_ELECTION_CODE`), **6257 = 1º turno** (`TSE_FIRST_ROUND_ELECTION_CODE`).
- Variáveis de ambiente (`apps/api/.env.example`):
  - `DATA_SOURCE` = `tse` | `fixture` | `simulation`
  - `TSE_BASE_URL`, `TSE_ELECTION_CODE`, `TSE_FIRST_ROUND_ELECTION_CODE`, `TSE_TIMEOUT_MS`
  - `FIXTURES_DIR`, `SIMULATION_DURATION_MINUTES`
- Fixtures reais em `apps/api/test/fixtures/`: `ele2026-6257` (1º turno, final) e `ele2026-6258-pre` (2º turno zerado), incluindo as 186 cidades do exterior (`pnpm --filter @stb/api fixtures:abroad <eleição> <pasta>` baixa de novo).
- **Nunca** chamar o TSE diretamente do navegador.

## Frontend

- Mapa SVG **pré-projetado em build** (`pnpm --filter @stb/web map:build`) a partir da malha do IBGE; ~14 KB gzip, sem d3/topojson no navegador.
- **Representação visual:** cada UF na cor de quem lidera; intensidade por **margem em p.p.** em 5 faixas (`<2`, `2–5`, `5–10`, `10–20`, `20+`). Cores validadas para daltonismo; a cor segue o candidato (ordem fixa por número de urna), nunca a posição. Detalhes em `docs/frontend.md`.
- **Abas de turno:** 2º turno (ao vivo) e 1º turno (final). Sem turno na URL, o site mostra o 1º turno até a apuração do 2º começar (`resolveRound`, ADR 0006).
- Navegação: **Brasil / Região / Estado / Exterior**, persistida no hash da URL junto com o turno (`#/sp`, `#/1turno/regiao/ne`, `#/2turno/exterior`). Os votos no exterior já estão somados no total do Brasil e também aparecem separados (botão no mapa, chip, seletor, compartilhamento).
- **Identidade (ADR 0007):** verde `#00843D` e amarelo `#FFD60A`, fundo `#F5F6F1`, fonte Schibsted Grotesk auto-hospedada; desenho de referência no Claude Design.
- Página: cabeçalho com selo de status → abas de turno → barra de abrangência fixa → card de resultado (migalhas, placar, números-chave, compartilhar) → mapa → lista de estados. Antes da apuração do 2º turno: contagem regressiva.
- **Percentual e total de votos SEMPRE visíveis** — informação mais relevante do site, em qualquer abrangência (Brasil, região, estado, exterior, país). Nenhuma tela pode substituí-los por outra métrica; contagens extras (estados vencidos numa região, países no exterior) vêm **junto**, nunca no lugar.
- 1º turno: além dos finalistas, o card de resultado lista os **demais candidatos** com % e votos, em qualquer abrangência.
- Região: % e votos de cada finalista na região + em quantos estados cada um venceu/lidera. Exterior: seção "Votação por país" (busca, continentes) com os votos de cada finalista por país.
- Números animados com tween em `requestAnimationFrame`; transições de cor/barras em CSS; sem biblioteca de animação.
- **% de seções apuradas** sempre visível no card de resultado ("100% apurado" ao lado das migalhas e o número-chave "Seções apuradas"), como no design.
- Polling via TanStack Query (20s), pausado quando a aba está oculta.
- Acessibilidade: paleta segura para daltônicos, contraste AA, sempre exibir rótulos/percentuais (nunca só cor), mapa navegável por teclado, lista por estado, `prefers-reduced-motion` respeitado. Só tema claro, com as cores exatas do desenho (ADR 0007).
- **Orçamento:** JS inicial ≈ 115 KB gzip. Verificar o tamanho após mudanças de dependências (ADR 0005); nada de bibliotecas pesadas no bundle inicial.

## Mobile first (requisito crítico)

A maior parte do público acessa pelo **celular** — a experiência mobile **não pode** ser inferior à desktop.

- Projetar e implementar **primeiro para 360px** de largura e só depois expandir para tablet/desktop.
- Interações por **toque**: nada depende de hover (o design não tem tooltip nem efeito de hover). Tocar numa UF seleciona e rola até o card de resultado dela. (Pendente: pinch-zoom/pan no mapa sem quebrar a rolagem da página.)
- Alvos de toque com no mínimo **44×44px**; textos legíveis sem zoom (≥ 16px no corpo).
- Respeitar `safe-area-inset-*` (notch / barra de gestos) e funcionar em retrato e paisagem.
- Desempenho em rede móvel: meta **Lighthouse mobile ≥ 90**, LCP < 2,5s em 4G, JS inicial enxuto, código não essencial carregado sob demanda.
- Testar em viewports reais (iPhone SE, iPhone recente, Android médio) nos testes e2e e manualmente antes de cada release.

## Compartilhamento em redes sociais (requisito crítico)

O usuário deve conseguir postar, em poucos toques, um **snapshot da apuração em tempo real** nos **Stories do Instagram** (e demais redes/WhatsApp).

- Botão **"Compartilhar"** no card de resultado ("Compartilhar Bahia") gera uma imagem com os dados **do momento**:
  - candidatos, percentuais e votos;
  - % de urnas apuradas;
  - abrangência atual (Brasil, região ou UF) com o mapa colorido;
  - data/hora da atualização ("Atualizado às HH:MM — fonte: TSE");
  - URL do site para gerar tráfego de volta.
- **Formatos:**
  - **Stories: 1080×1920 (9:16)** — padrão; respeitar as áreas seguras do Instagram (sem conteúdo essencial nos ~250px do topo e da base).
  - Feed: 1080×1350 (4:5) como opção.
- **Geração no cliente** com Canvas 2D em módulo carregado sob demanda: não consome funções/banda da Vercel, é instantânea e usa exatamente os dados exibidos na tela.
- **Envio:** Web Share API com arquivo (`navigator.share({ files })`), que abre a folha de compartilhamento nativa do iOS/Android com Instagram Stories, WhatsApp etc. Fallback: **baixar a imagem** (desktop ou navegador sem suporte). Não existe API web oficial para postar direto nos Stories — não tentar deep links proprietários.
- **Link preview (Open Graph) — pendente:** imagem 1200×630 gerada no servidor (ex.: `@vercel/og`), cacheada pelo CDN como os demais endpoints, para que links compartilhados no WhatsApp/X/Facebook mostrem o placar atual.
- Visual das imagens segue a identidade do site e é legível em tela pequena (números grandes, alto contraste).

## Atualização dos dados e limites do Vercel Hobby

- **Defasagem esperada:** ~15–40s em relação ao TSE (que já publica em lotes). Cron não é necessário (e no Hobby só roda 1x/dia).
- **Invocações de função:** limitadas pelo cache (algumas por minuto por endpoint), independentes do número de usuários.
- **Risco principal — banda de 100 GB/mês:** manter payloads mínimos e comprimidos, assets estáticos leves, monitorar o uso no dia da eleição. Plano B: upgrade para Pro apenas no mês da eleição.
- O plano Hobby exige **uso não comercial**.

## Comandos

> Atualizar esta seção sempre que scripts forem criados ou alterados.

```bash
pnpm install                       # instala dependências
cp apps/api/.env.example apps/api/.env
pnpm dev                           # API (:3001) + web (:5173, proxy /api)
pnpm lint                          # ESLint
pnpm format:check                  # Prettier (pnpm format para corrigir)
pnpm typecheck                     # tsc em todos os pacotes
pnpm test                          # Vitest em todos os pacotes
pnpm build                         # build da web + .vercel/output
pnpm --filter @stb/web map:build   # regera o mapa a partir do IBGE
pnpm --filter @stb/api fixtures:abroad 6257 test/fixtures/ele2026-6257  # baixa as cidades do exterior
```

## Status e próximos passos

Implementado: domínio, contrato, API (TSE ao vivo, fixtures, simulação, fallback stale), web (redesenho verde e amarelo: card de resultado, mapa, regiões, lista de estados, contagem regressiva), compartilhamento Stories/Feed, build da Vercel e CI.

Pendente:

- `GET /api/og` (prévia de links com o placar atual).
- Pinch-zoom/pan do mapa no mobile.
- Testes e2e (Playwright) em viewports de celular e auditoria Lighthouse.
- Primeiro deploy de Preview: conferir `x-vercel-cache` e compressão (checklist em `docs/architecture.md`).

## Regras de trabalho (OBRIGATÓRIAS)

### Commits

- **SEMPRE** dividir o trabalho no **maior número possível de commits** pequenos e atômicos: uma mudança lógica por commit. Separar configuração, código, testes e documentação em commits distintos.
- Usar **[Conventional Commits](https://www.conventionalcommits.org/)**: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `build`, `ci`, `style`, `perf`. Usar escopo quando útil, ex.: `feat(web): add animated state map`, `test(api): cover TSE adapter mapping`.
- Mensagens em inglês, no imperativo, linha de assunto curta.

### Autoria

- O Claude **NUNCA** se coloca como autor ou coautor: **sem** `Co-Authored-By`, **sem** "Generated with Claude Code" ou qualquer atribuição em commits, PRs ou arquivos.

### Documentação

- **Toda implementação deve ser documentada**, em commit `docs:` próprio:
  - README (uso e setup) e `docs/` (detalhes técnicos);
  - ADR em `docs/adr/` para cada decisão de arquitetura;
  - TSDoc em APIs públicas dos pacotes;
  - atualizar **este CLAUDE.md** quando arquitetura, comandos ou convenções mudarem.

### Qualidade

- Toda lógica de domínio e todo adaptador têm testes (adaptador TSE testado com fixtures reais).
- Lint, typecheck e testes devem passar antes de cada commit.
