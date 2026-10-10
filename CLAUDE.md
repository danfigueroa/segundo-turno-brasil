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

## Stack

| Camada       | Tecnologia                                                        |
| ------------ | ----------------------------------------------------------------- |
| Frontend     | React + Vite + TypeScript, TanStack Query, d3-geo, Framer Motion  |
| Backend      | Vercel Functions em TypeScript (serverless)                       |
| Contrato     | Schemas `zod` compartilhados entre back e front                   |
| Hospedagem   | Vercel (plano Hobby, gratuito)                                    |
| Monorepo     | pnpm workspaces                                                   |
| Qualidade    | ESLint, Prettier, Vitest, Testing Library, Playwright (opcional)  |
| CI           | GitHub Actions                                                    |

> Por que não Go? O backend é um proxy fino cacheado pelo CDN: roda poucas vezes por minuto, então a performance da linguagem não faz diferença. TypeScript é o runtime de primeira classe na Vercel e permite **um único contrato de tipos** entre back e front.

## Arquitetura

```
Navegador (React SPA)
   │  polling ~20s
   ▼
CDN Vercel ── cache hit (< 15s) ──> resposta imediata
   │  cache expirado
   ▼
/api/* (Vercel Functions, TypeScript)
   │  Cache-Control: public, s-maxage=15, stale-while-revalidate=30, stale-if-error=600
   ▼
resultados.tse.jus.br (JSON público do TSE)
```

- **Sem cron e sem banco de dados.** O CDN absorve o tráfego; a função só executa quando o cache expira. O próprio acesso dos usuários dispara a atualização.
- **Endpoints planejados:**
  - `GET /api/results/br` — resultado nacional
  - `GET /api/results/states` — as 27 UFs agregadas (alimenta o mapa)
  - `GET /api/results/states/:uf` — detalhe de uma UF
  - Regiões (Norte, Nordeste, Centro-Oeste, Sudeste, Sul) são derivadas das UFs no domínio.
- **Falha do TSE:** `stale-if-error` mantém a última cópia; a UI exibe "Última atualização às HH:MM".

### Arquitetura limpa (ports & adapters)

```
apps/
  web/                 # React SPA — consome apenas packages/contracts
  api/                 # Vercel Functions
    src/
      handlers/        # HTTP fino: parse da requisição, chama caso de uso, aplica headers de cache
      use-cases/       # GetNationalResults, GetStatesResults, GetStateResults
      ports/           # ResultsSource (interface)
      adapters/
        tse/           # TseResultsSource: HTTP + validação zod do JSON do TSE + mapeamento p/ domínio
        fixture/       # FixtureResultsSource: dados de 2022 para dev/testes
    test/fixtures/     # JSON reais do TSE (2022, 2º turno)
packages/
  domain/              # entidades e regras puras (sem I/O)
  contracts/           # schemas zod da API pública + tipos inferidos
docs/
  adr/                 # Architecture Decision Records
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
- Arquivos simplificados por abrangência (`br`, `sp`, `rj`, …).
- O **código da eleição de 2026 (2º turno) ainda precisa ser confirmado** no `ele-c.json` quando o TSE publicar. Tudo é configurável por variáveis de ambiente:
  - `TSE_BASE_URL`
  - `TSE_ELECTION_CODE`
  - `DATA_SOURCE` = `tse` | `fixture`
- Desenvolvimento e testes usam dados reais de **2022, 2º turno (eleição 545)** salvos em `apps/api/test/fixtures/`.
- **Nunca** chamar o TSE diretamente do navegador.

## Frontend

- Mapa SVG gerado a partir de **TopoJSON simplificado** das UFs (projeção com d3-geo, arquivo < ~100 KB, servido estático).
- **Representação visual:** cada UF é pintada na cor do candidato que lidera, com **intensidade proporcional à margem** (escala divergente entre as duas cores). Painel lateral com números absolutos e percentuais.
- Navegação: **Brasil / Região / Estado**, com transições animadas (Framer Motion): cores interpoladas, contadores e barras animados.
- Barra de progresso de **% de urnas apuradas** sempre visível.
- Polling via TanStack Query (~20s), pausado quando a aba está oculta.
- Acessibilidade: paleta segura para daltônicos, contraste AA, sempre exibir rótulos/percentuais (nunca só cor), mapa navegável por teclado, `prefers-reduced-motion` respeitado, tema claro/escuro.

## Atualização dos dados e limites do Vercel Hobby

- **Defasagem esperada:** ~15–40s em relação ao TSE (que já publica em lotes). Cron não é necessário (e no Hobby só roda 1x/dia).
- **Invocações de função:** limitadas pelo cache (algumas por minuto por endpoint), independentes do número de usuários.
- **Risco principal — banda de 100 GB/mês:** manter payloads mínimos e comprimidos, assets estáticos leves, monitorar o uso no dia da eleição. Plano B: upgrade para Pro apenas no mês da eleição.
- O plano Hobby exige **uso não comercial**.

## Comandos

> Atualizar esta seção sempre que scripts forem criados ou alterados.

```bash
pnpm install      # instala dependências
pnpm dev          # sobe web + api localmente
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit em todos os pacotes
pnpm test         # Vitest
pnpm build        # build de produção
```

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
