# 0002 — Atualização dirigida pelo CDN e endpoint único

- Status: aceita
- Data: 2026-10-10

## Contexto

O plano Hobby só permite cron diário. O planejamento inicial previa três endpoints (`/br`, `/states`, `/states/:uf`).

## Decisão

- Sem cron e sem banco: `GET /api/results` responde com `s-maxage=15, stale-while-revalidate=30, stale-if-error=600`. O acesso dos usuários dispara a revalidação.
- **Um único endpoint** com Brasil, exterior e as 27 UFs; regiões são agregadas no cliente.

## Consequências

- Uma requisição por ciclo de polling e um snapshot sempre consistente entre placar e mapa.
- Cada revalidação faz 29 requisições ao TSE (em paralelo); com o cache, isso ocorre poucas vezes por minuto.
- Defasagem esperada de ~15–40s em relação ao TSE, que já publica em lotes (~1/min).
