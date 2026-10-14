# 0026 — Polling de 30s no 2º turno

- Status: substituída pela ADR 0028
- Data: 2026-10-12

## Contexto

O limite que mais aperta no plano Hobby da Vercel é o de **requisições no CDN** (cerca de 1 milhão por mês), não o de funções: o cache segura a função, mas toda consulta de cada navegador conta. Com polling de 20s, cada pessoa faz 3 requisições por minuto, e cerca de 1.850 pessoas acompanhando por 3 horas já esgotariam o mês. Cada resposta de `/api/results` tem cerca de 7,7 KB com gzip, o que pesa também na banda de 100 GB.

## Decisão

- O front consulta `/api/results` do 2º turno a cada **30s** (`POLL_INTERVAL_MS`), em vez de 20s.
- O cache do CDN continua com `s-maxage=15`: o intervalo segue maior que o cache, então cada consulta pode trazer dados novos.
- `/api/cities` e `/api/abroad` continuam a cada 60s.

## Consequências

- Um terço a menos de requisições e de banda por pessoa.
- A defasagem em relação ao TSE vai de ~15–40s para ~15–50s no pior caso. O TSE já publica em lotes, então a diferença quase não aparece.
- Não resolve sozinho o pico da noite da eleição: para dezenas de milhares de pessoas ao mesmo tempo ainda é preciso um CDN sem limite de requisições na frente (ex.: Cloudflare) ou o plano Pro no mês da eleição.
