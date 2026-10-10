# 0009 — Fotos oficiais dos candidatos nos avatares

- Status: aceita
- Data: 2026-10-10

## Contexto

O design usa as iniciais ("L", "FB") num círculo da cor do candidato. Foi pedido trocar pelas fotos dos candidatos. O TSE publica a foto oficial de urna de cada candidato em `{base}/{ciclo}/{eleição}/fotos/br/{sqcand}.jpeg` (161×225, ~7 KB), mas o navegador nunca deve chamar o TSE.

## Decisão

- `pnpm --filter @stb/web photos:fetch` baixa as fotos dos candidatos do 2º turno para `apps/web/public/candidates/{número}.jpeg`, versionadas no repositório e servidas como asset estático.
- `CandidateAvatar` mostra a foto dentro de um anel na cor do candidato (a cor continua identificando quem é quem) e volta para as iniciais se não houver foto para aquele número.
- Usado no card de resultado e na contagem regressiva; a imagem de compartilhamento continua com os quadrados de cor.

## Consequências

- ~14 KB a mais por visita (cache longo do CDN), sem chamadas ao TSE no navegador.
- Só os finalistas do 2º turno têm foto; outros números caem nas iniciais.
