# 0031 — Menos requisições no CDN e funções mais robustas para a noite da eleição

- Status: aceita
- Data: 2026-10-20
- Complementa: ADR 0011, 0020, 0025 e 0028

## Contexto

Na Vercel Hobby, o que se esgota é a cota mensal de cerca de **1 milhão de requisições no CDN** (ADR 0028). Toda consulta conta, inclusive o `304`. Com polling de 60s, uma pessoa olhando o Brasil gasta cerca de 180 requisições em 3h; com um estado ou o Exterior aberto, o dobro.

Uma auditoria de performance antes de 25/10 encontrou várias fontes de desperdício:

- O polling **nunca parava**, nem com 100% das seções apuradas.
- O embed (ADR 0025) fazia polling mesmo fora da tela de quem lia o portal.
- Com `staleTime: 0`, cada volta à aba ou a um estado visto há pouco disparava uma nova consulta.
- O TanStack Query tentava de novo **3 vezes** cada consulta que falhava. Num `503`, que é `no-store`, isso dá até 4 requisições por consulta.
- Um parâmetro qualquer na URL (`?x=123`) virava uma chave de cache nova e chegava à função, que ia ao TSE.

Nas funções também havia problemas:

- A gravação do histórico no Blob ficava no caminho crítico de `/api/results`.
- Cada perda de cache do CDN, vinda de qualquer região, buscava tudo de novo no TSE.
- Um único arquivo que falhasse derrubava um estado inteiro (MG tem 853 arquivos).

## Decisão

**No front:**

- **Polling adaptativo** (`api/polling.ts`, `pollIntervalOf`):
  - para (`false`) quando a abrangência buscada está 100% apurada: o Brasil em `/api/results`, a soma dos municípios em `/api/cities`, a soma dos países em `/api/abroad`;
  - fica em 120s antes das 17h de 25/10 enquanto nada foi apurado;
  - fica em 60s no resto do tempo.
- **`staleTime` de 45s** nas consultas ao vivo. O polling continua de 60 em 60s, mas a volta à aba e a troca de abrangência dentro desse tempo reaproveitam os dados.
- **Uma nova tentativa só**, 5s depois, por consulta que falha (`QueryClient` em `main.tsx`). O próximo poll tenta de novo de qualquer forma.
- **Embed:** polling a cada 120s, e as consultas do 2º turno ficam pausadas enquanto o iframe está fora da tela (`usePageInViewport`). Dentro de um iframe, o `IntersectionObserver` usa como referência a tela da página que incorpora.

**Na API:**

- Os quatro endpoints respondem **`400`** a parâmetro desconhecido ou repetido (`unexpectedParam`), exceto os `x-vercel-*` da própria Vercel.
- `uf` e `scope` precisam vir **em minúsculas**, para que cada estado tenha uma única chave de cache.
- A resposta com dados antigos (`stale`) passa a ser `public, s-maxage=5, stale-while-revalidate=30, stale-if-error=600`. Enquanto o TSE está fora, ninguém espera o timeout dele.
- `GetLatest` ganha `reuseForMs`: um valor bom mais novo que isso é devolvido sem ir à fonte. Os tempos ficam abaixo do cache do CDN de cada endpoint:
  - results: 10s;
  - cities e abroad: 20s;
  - history: 30s, o que poupa operações do Blob.
- **`RecordHistory` sai do caminho crítico.** A gravação vai para o `waitUntil` da Vercel (`http/wait-until.ts`, lido do contexto da requisição como faz `@vercel/functions`), e as gravações de uma instância rodam uma de cada vez.
- **Arquivos do TSE:**
  - uma nova tentativa depois de erro de rede, timeout ou 5xx (um 4xx não se repete);
  - no máximo 64 requisições simultâneas por instância, somando todos os loaders (`createLimiter`);
  - se o arquivo de andamento de uma UF falhar, vale o último lido, em vez de baixar todos os municípios de novo.
- **`maxDuration` explícito:** 30s em `/api/results` e 60s em `/api/abroad` e `/api/cities`.

**Nos arquivos estáticos:**

- Fotos dos candidatos, `favicon.svg` e `og.png` não têm hash no nome; passam a ter `public, max-age=86400`.
- `/api/*` desconhecido responde um 404 em JSON (`api-404.json`). Antes, a rota apontava para um `/404.html` que não existia.

## Consequências

- Quem acompanha até o fim deixa de gastar requisições depois dos 100%. Embeds fora da tela não gastam nada.
- Um surto de falhas custa no máximo 2 requisições por consulta, em vez de 4.
- A resposta de `/api/results` não espera mais o Blob.
- Cache misses de várias regiões, uns logo depois dos outros, custam uma única ida ao TSE por instância.
- A defasagem cresce no máximo o tempo de `reuseForMs` (10s nos resultados), dentro dos ~15–80s já esperados.
- Links da API com `uf` em maiúsculas, ou com parâmetros extras, deixam de funcionar. O front sempre usou a forma canônica.
- **Não muda o piso de ~180 requisições por pessoa em 3h.** Para um público muito maior que ~5–6 mil pessoas na noite, ainda vale o plano Pro no mês da eleição ou um CDN sem limite de requisições na frente (ADR 0028).
- **A conferir no Preview:**
  - o `waitUntil` está disponível com `shouldAddHelpers: false`: nos logs, `history_write_failed` some e o histórico ganha pontos;
  - a Vercel não acrescenta parâmetros próprios fora de `x-vercel-*`.
