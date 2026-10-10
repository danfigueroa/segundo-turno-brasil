# Arquitetura

## Visão geral

```
Navegador (React SPA)
   │  polling a cada 20s (pausa com a aba oculta)
   ▼
CDN da Vercel ── cópia < 15s ──> resposta imediata
   │  cópia expirada: entrega a cópia atual e revalida em background
   ▼
GET /api/results  (Vercel Function, Node 22, um único arquivo ESM)
   │  29 requisições em paralelo: br, zz (exterior) e as 27 UFs
   ▼
resultados.tse.jus.br  (JSON público; CDN do TSE com max-age≈56s)
```

O 1º turno (`?round=1`, eleição 6257) passa pelo mesmo caminho, mas como o resultado é final fica 1h em cache no CDN (e um dia como `stale`), então praticamente não gera invocações.

Não há cron nem banco de dados: o tráfego dos usuários é o gatilho das atualizações e o CDN absorve a carga. Com `s-maxage=15`, a função roda no máximo algumas vezes por minuto por região do CDN, independentemente do número de usuários.

## Camadas (ports & adapters)

| Camada      | Onde                                        | Responsabilidade                                                                                                                                                                                  |
| ----------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domínio     | `packages/domain`                           | Tipos (`Tally`, `Scope`), UFs/regiões, ranking, liderança, agregação, perspectiva de virada (`outlook`), comparação entre turnos (`swing`), histórico e ritmo (`appendEntry`, `paceOf`). Sem I/O. |
| Contrato    | `packages/contracts`                        | Schema zod/mini da resposta pública; front e back usam o mesmo tipo.                                                                                                                              |
| Porta       | `apps/api/src/ports/`                       | `ResultsSource.fetchSnapshot()`, `AbroadSource.fetchCountries()`, `HistoryStore`                                                                                                                  |
| Adaptadores | `apps/api/src/adapters`                     | `TseResultsSource`, `TseAbroadSource` (+ loaders), versões simuladas, `BlobHistoryStore`/`MemoryHistoryStore`                                                                                     |
| Caso de uso | `apps/api/src/use-cases/`                   | `GetResults`/`GetAbroad`/`GetHistory` sobre `GetLatest`: deduplica e serve o último dado bom. `RecordHistory` grava a curva do 2º turno.                                                          |
| HTTP        | `apps/api/src/http`                         | Handler Fetch API (`Request → Response`) + adaptador para Node.                                                                                                                                   |
| Composição  | `apps/api/src/container.ts`                 | Uma fonte e um `GetResults` por turno, conforme o `DATA_SOURCE`; monta as rotas.                                                                                                                  |
| Entradas    | `apps/api/src/dev-server.ts`, `src/vercel/` | Servidor local e função da Vercel, ambos sobre o mesmo handler.                                                                                                                                   |

O formato do TSE só é conhecido por `adapters/tse`. Todo arquivo do TSE é validado com zod antes de virar entidade de domínio.

## Resiliência

1. **CDN:** `stale-while-revalidate=30` evita que usuários esperem a revalidação; `stale-if-error=600` mantém a última resposta se a função falhar.
2. **Função:** se o TSE falhar, `GetResults` devolve o último snapshot bom da instância com `stale: true` e cache curto (`s-maxage=5`), e a UI avisa o horário dos dados.
3. **Sem snapshot nenhum:** responde `503` com `no-store` e `retry-after: 15`; a UI mostra "Tentar novamente".
4. **Timeout:** cada arquivo do TSE tem limite de 8s (`TSE_TIMEOUT_MS`).
5. **Histórico:** gravar no Blob é best-effort (5s de timeout, erro só logado); `/api/results` nunca falha por causa dele (ADR 0011).

## Deploy (Build Output API v3)

`pnpm build` gera `.vercel/output` com `scripts/build-vercel-output.mjs`:

- `static/` — build do Vite; `/assets/*` com cache imutável de 1 ano.
- `functions/api/results.func/`, `functions/api/abroad.func/` e `functions/api/history.func/` — funções empacotadas pelo esbuild (`index.mjs`, Node 22).
- `config.json` — cabeçalhos de segurança, fallback SPA para `index.html` e 404 para `/api/*` desconhecido.

Empacotar nós mesmos evita depender de como a Vercel compilaria TypeScript de pacotes do workspace (ver [ADR 0003](adr/0003-build-output-api.md)). Para conferir localmente, rode `pnpm build` e importe `index.mjs` num servidor `node:http`.

### Checklist pós-deploy (Preview)

- `curl -I https://<preview>/api/results` → `x-vercel-cache` deve alternar entre `MISS`, `HIT` e `STALE`.
- O payload deve sair comprimido (`content-encoding: br` ou `gzip`).
- `BLOB_READ_WRITE_TOKEN` configurado (Storage → Blob → conectar ao projeto); com a apuração andando, `curl https://<preview>/api/history` deve trazer pontos.

## Limites do plano Hobby

- **Banda de 100 GB/mês** é o principal risco: a resposta tem ~40 KB sem compressão no 1º turno (12 candidatos) e bem menos no 2º turno; o JS inicial tem ~115 KB gzip.
- **Vercel Blob** (histórico da apuração, ADR 0011): 2.000 operações avançadas e 10.000 simples por mês; a noite da eleição usa algumas centenas.
- Uso **não comercial**.
- Plano B: upgrade para Pro apenas no mês da eleição.
