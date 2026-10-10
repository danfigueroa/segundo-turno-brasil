# 0008 — Votação no exterior por país

- Status: aceita
- Data: 2026-10-10

## Contexto

O design mostra, no Exterior, a votação **por país** (busca, filtro por continente, vencedor em cada país). O TSE não publica nada por país: o exterior vem em **186 arquivos por cidade** (`zz/zz{cidade}-c0001-e{eleição}-u.json`), e a lista de cidades (`config/mun-e{eleição}-cm.json`) não informa o país.

## Decisão

- Novo endpoint **`GET /api/abroad?round=1|2`**, separado de `/api/results`: o snapshot principal continua leve e o detalhe por país só é buscado quando o usuário abre o Exterior.
- A função lê as 186 cidades (até 24 requisições simultâneas) e soma por país com uma **tabela fixa cidade → país → continente** (`adapters/tse/abroad-cities.ts`), mantida por nós; os códigos de cidade são os mesmos nos dois turnos. Oceania entra em "Ásia e Oceania", como no design.
- Falha de qualquer cidade invalida a leitura inteira (nunca mostramos um país incompleto); vale o mesmo fallback `stale` do `/api/results` (`GetLatest`).
- Cache do 2º turno: **`s-maxage=60`** (o TSE atualiza ~1x/min e cada atualização custa 186 requisições); 1º turno, 1h.
- A resposta traz os votos de todos os candidatos por país (chave = número de urna); o front considera só os dois finalistas ("votos nos 2 candidatos").

## Consequências

- Cada execução leva ~1–2 s e ~1,7 MB de tráfego com o TSE; com o cache de 60 s isso acontece no máximo ~1x/min por região do CDN.
- Resposta de ~23 KB sem compressão no 1º turno (~13 KB no 2º), cacheada pelo CDN.
- Se o TSE criar ou renomear cidades, a tabela precisa ser atualizada (há teste garantindo as 186 cidades mapeadas e que a soma dos países bate com o total do exterior).
