# 0015 — Funções na região de São Paulo

- Status: aceita
- Data: 2026-10-10

## Contexto

Sem configuração, as funções da Vercel rodam em `iad1` (Washington). O público está quase todo no Brasil, mas ele não fala com a função: o CDN entrega estáticos e respostas de `/api/*` em cache do ponto de presença mais próximo (São Paulo), seja qual for a região da função.

A distância pesa entre a função e o TSE (`resultados.tse.jus.br`, no Brasil): cerca de 120 ms de ida e volta a partir de `iad1`, contra poucos ms a partir de São Paulo. `/api/cities` a frio baixa todos os municípios de um estado (853 em MG, em levas de 32), `/api/abroad` lê 186 arquivos e `/api/results` lê 28: cada leva paga essa latência.

## Decisão

Todas as funções rodam em `gru1` (São Paulo), declarado em `regions` no `.vc-config.json` gerado por `scripts/build-vercel-output.mjs`. O plano Hobby permite uma única região, o que basta.

## Consequências

- Menos tempo por atualização, dados um pouco mais frescos e mais folga até o `maxDuration` de `/api/cities`.
- Se o TSE restringir o acesso vindo de fora do país no pico, as funções não são afetadas.
- O Blob store do histórico (ADR 0011) tem região própria; se estiver fora de `gru1`, as gravações de `RecordHistory` cruzam o continente. É uma escrita por avanço do total, então não compensa recriar o store.
- A região fica no código, não no painel do projeto.
