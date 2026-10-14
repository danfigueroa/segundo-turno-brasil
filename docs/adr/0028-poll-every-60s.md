# 0028 — Polling de 60s no 2º turno

- Status: aceita
- Data: 2026-10-14
- Substitui: ADR 0026

## Contexto

O CDN aguenta qualquer número de pessoas ao mesmo tempo, e a função só roda quando o cache expira (`s-maxage=15`), seja qual for o público. O que se esgota no plano Hobby é a **cota mensal de requisições no CDN** (cerca de 1 milhão): toda consulta de cada navegador conta, inclusive o `304` sem dados novos (ADR 0020). A banda de 100 GB pesa menos, porque o `304` quase não tem corpo.

Contando só `/api/results` em 3 horas de apuração:

- polling de 30s: 360 requisições por pessoa, a cota acaba com cerca de **2.800 pessoas**;
- polling de 60s: 180 requisições por pessoa, cerca de **5.500 pessoas**.

Cada visita nova soma ainda de 15 a 25 requisições de arquivos estáticos (HTML, JS, fonte, fotos, malhas), e o resto do mês já terá gasto parte da cota.

## Decisão

- O front consulta `/api/results` do 2º turno a cada **60s** (`POLL_INTERVAL_MS`), igual a `/api/cities` e `/api/abroad`.
- O cache do CDN continua com `s-maxage=15`: aumentá-lo só reduziria invocações de função, que não são o limite.

## Consequências

- Metade das requisições ao CDN por pessoa: o mesmo mês de cota aguenta cerca do dobro de público.
- A defasagem em relação ao TSE vai de ~15–50s para ~15–80s no pior caso.
- Ainda não resolve dezenas de milhares de pessoas ao mesmo tempo: para isso, um CDN sem limite de requisições na frente (ex.: Cloudflare) ou o plano Pro no mês da eleição.
