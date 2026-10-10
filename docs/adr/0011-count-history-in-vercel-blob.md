# 0011 — Histórico da apuração no Vercel Blob

- Status: aceita
- Data: 2026-10-10

## Contexto

Queremos mostrar a **curva da apuração** (% de cada finalista conforme as seções são apuradas, o momento de uma "virada") e o **ritmo** (seções/min e previsão de 100%). O TSE só publica o estado atual, e o projeto não tem banco nem cron (ADR 0002): sem guardar os snapshots, quem abre o site tarde não vê o que aconteceu antes.

## Decisão

- A cada busca do 2º turno, `RecordHistory` grava um ponto **quando o total nacional de seções apuradas avança** (`appendEntry` em `packages/domain`). O ponto tem, para Brasil, exterior e as 27 UFs, as seções apuradas/totais e os votos por número de urna, no horário de totalização do TSE. A gravação é **best-effort**: falha é logada (`history_write_failed`) e nunca derruba `/api/results`.
- O histórico é **um único arquivo JSON privado** no Vercel Blob (`history/{eleição}.json`). Para gravar, a função lê a versão mais recente (`useCache: false`) e escreve com `ifMatch` (ETag); num conflito tenta de novo uma vez. Leituras usam o cache do Blob (`cacheControlMaxAge=60`).
- Novo endpoint **`GET /api/history?scope=br|zz|<uf>|regiao-<código>`** devolve só a curva da abrangência pedida (regiões somadas no servidor), com `s-maxage=60`. O front busca o histórico uma vez e acrescenta os pontos que já recebe no polling de `/api/results`, então não precisa de cache mais curto.
- **Credenciais:** `BLOB_READ_WRITE_TOKEN` (token estático) ou, quando o store é conectado ao projeto pelo método novo da Vercel, `BLOB_STORE_ID` + **OIDC**. O token OIDC chega em cada requisição no cabeçalho `x-vercel-oidc-token`; o adaptador Node o guarda num `AsyncLocalStorage` (`http/request-context.ts`) e o `BlobHistoryStore` o lê a cada operação, sem depender do contexto que a Vercel injeta só nos runtimes dela (aqui empacotamos com a Build Output API, ADR 0003).
- O Blob só é usado com `DATA_SOURCE=tse` e uma das credenciais acima; em `fixture`/`simulation` (ou sem token) o histórico fica em memória (`MemoryHistoryStore`), para nenhuma simulação escrever no histórico de produção.

## Alternativas descartadas

- **Só no navegador:** a curva começaria quando a pessoa abrisse a página.
- **Um blob por ponto + `list()`:** `list` é operação avançada; cada leitura do histórico custaria uma.
- **Upstash/Redis:** mais uma conta e um serviço externo para um único arquivo.

## Consequências

- Operações no plano Hobby (2.000 avançadas e 10.000 simples por mês): cerca de 1 `put` (avançada) e 1 leitura sem cache (simples) por atualização do TSE (~1/min), ou seja, algumas centenas na noite. As leituras do endpoint batem no cache do Blob.
- O arquivo cresce ~1,7 KB por ponto (~500 KB em 300 pontos); a resposta por abrangência fica em poucos KB comprimidos.
- O SDK `@vercel/blob` traz o `undici`: cada função passou de ~470 KB para ~1,1 MB (só no servidor, sem efeito no bundle do navegador).
- Com instâncias concorrentes, um ponto pode se perder num conflito duplo; a curva só fica um pouco mais espaçada.
- Sem token em produção, cada instância teria um histórico próprio em memória: configurar o Blob antes de 25/10.
