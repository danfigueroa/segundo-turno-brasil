# API

## `GET /api/results?round=1|2`

Snapshot consistente de todas as abrangências de um turno. `round` é opcional (padrão `2`, o 2º turno ao vivo); `round=1` traz o resultado final do 1º turno (eleição 6257). Schema: [`packages/contracts/src/results.ts`](../packages/contracts/src/results.ts).

```jsonc
{
  "round": 2,                       // 1 = 1º turno, 2 = 2º turno
  "country": Tally,                 // Brasil (inclui exterior)
  "states": { "AC": Tally, ... },   // as 27 UFs, sempre todas
  "abroad": Tally,                  // votos no exterior (TSE: "zz")
  "fetchedAt": "2026-10-25T22:42:10.000Z", // quando buscamos no TSE
  "stale": false                    // true = TSE indisponível, dados antigos
}
```

`Tally`:

| Campo        | Tipo                                                             | Descrição                                          |
| ------------ | ---------------------------------------------------------------- | -------------------------------------------------- |
| `scope`      | `{kind:'country'\|'abroad'}` ou `{kind:'state'\|'region', code}` | Abrangência                                        |
| `candidates` | `{number,name,party,votes,share}[]`                              | Ordenados por votos; `share` = % dos votos válidos |
| `sections`   | `{total, counted}`                                               | Seções eleitorais totais e totalizadas             |
| `electorate` | `number`                                                         | Eleitorado apto                                    |
| `turnout`    | `number`                                                         | Comparecimento                                     |
| `votes`      | `{valid, blank, null}`                                           | Válidos, brancos e nulos                           |
| `updatedAt`  | ISO 8601 (`-03:00`)                                              | Horário da totalização no TSE                      |

Regiões não vêm na resposta: são agregadas no cliente com `aggregateRegion` (`packages/domain`).

### Respostas

| Status | Quando                                    | `cache-control`                                                             |
| ------ | ----------------------------------------- | --------------------------------------------------------------------------- |
| 200    | 2º turno, dados frescos                   | `public, s-maxage=15, stale-while-revalidate=30, stale-if-error=600`        |
| 200    | 1º turno (resultado final)                | `public, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=86400` |
| 200    | `stale: true` (TSE fora, snapshot antigo) | `public, s-maxage=5`                                                        |
| 503    | TSE fora e nenhum snapshot em memória     | `no-store` + `retry-after: 15`                                              |
| 400    | `round` diferente de 1 ou 2               | `no-store`                                                                  |
| 405    | Método diferente de GET/HEAD              | `no-store`                                                                  |
