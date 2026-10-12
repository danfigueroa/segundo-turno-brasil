# API

Toda resposta 200 traz um `etag` fraco (hash dos dados, sem `fetchedAt`). Com `If-None-Match` igual, a API e o CDN respondem `304` sem corpo e com os mesmos cabeçalhos de cache: quem faz polling só baixa o JSON quando os dados mudam (ADR 0020).

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

| Campo               | Tipo                                                             | Descrição                                                                                        |
| ------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `scope`             | `{kind:'country'\|'abroad'}` ou `{kind:'state'\|'region', code}` | Abrangência                                                                                      |
| `candidates`        | `{number,name,party,votes,share}[]`                              | Ordenados por votos; `share` = % dos votos válidos                                               |
| `sections`          | `{total, counted}`                                               | Seções eleitorais totais e totalizadas                                                           |
| `electorate`        | `number`                                                         | Eleitorado apto                                                                                  |
| `countedElectorate` | `number` (opcional)                                              | Eleitorado das seções já apuradas (TSE `e.est`), base da abstenção durante a apuração (ADR 0022) |
| `turnout`           | `number`                                                         | Comparecimento                                                                                   |
| `votes`             | `{valid, blank, null}`                                           | Válidos, brancos e nulos                                                                         |
| `updatedAt`         | ISO 8601 (`-03:00`)                                              | Horário da totalização no TSE                                                                    |

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

## `GET /api/abroad?round=1|2`

Votos no exterior **por país e por cidade** (ADR 0008, 0013 e 0019). O TSE só publica o exterior por cidade; a API devolve as 186 cidades (com coordenadas) e a soma delas por país, com eleitorado, comparecimento, brancos e nulos, para o card de resultado de cada país. Buscado pelo front apenas com o Exterior (ou um país) aberto. Schema: [`packages/contracts/src/abroad.ts`](../packages/contracts/src/abroad.ts).

```jsonc
{
  "round": 1,
  "countries": [
    {
      "name": "Portugal",
      "continent": "EU", // AM | EU | AS (Ásia e Oceania) | AF
      "votes": { "13": 26401, "22": 19412, "55": 312 }, // por número de urna
      "sections": { "total": 120, "counted": 120 },
      "electorate": 98000,
      "turnout": 47500, // comparecimento
      "ballots": { "valid": 46125, "blank": 590, "null": 785 },
      "updatedAt": "2026-10-04T21:10:00-03:00", // a cidade mais recente
    },
  ],
  "cities": [
    {
      "code": "29955", // código de cidade do TSE
      "name": "LISBOA", // como o TSE publica
      "country": "Portugal",
      "continent": "EU",
      "lat": 38.7,
      "lon": -9.1,
      "electorate": 61234,
      "turnout": 27100,
      "votes": { "13": 15201, "22": 11002, "55": 190 },
      "ballots": { "valid": 26393, "blank": 300, "null": 407 },
      "sections": { "total": 70, "counted": 70 },
      "updatedAt": "2026-10-04T21:10:00-03:00",
    },
  ],
  "fetchedAt": "2026-10-05T15:00:00.000Z",
  "stale": false,
}
```

| Status | Quando                            | `cache-control`                                                             |
| ------ | --------------------------------- | --------------------------------------------------------------------------- |
| 200    | 2º turno, dados frescos           | `public, s-maxage=60, stale-while-revalidate=60, stale-if-error=600`        |
| 200    | 1º turno (resultado final)        | `public, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=86400` |
| 200    | `stale: true`                     | `public, s-maxage=5`                                                        |
| 503    | TSE fora e nenhum dado em memória | `no-store` + `retry-after: 60`                                              |
| 400    | `round` diferente de 1 ou 2       | `no-store`                                                                  |

## `GET /api/cities?uf=xx&round=1|2`

Votos de **cada município de um estado** (ADR 0014). `uf` é a sigla da UF (sem diferenciar maiúsculas) e é obrigatória; `round` é opcional e vale 2 por padrão. O front só busca com um estado ou uma cidade aberta. Schema: [`packages/contracts/src/cities.ts`](../packages/contracts/src/cities.ts).

```jsonc
{
  "round": 1,
  "uf": "AC",
  "cities": [
    {
      "ibge": "1200401", // código do IBGE (chave do mapa municipal)
      "name": "RIO BRANCO", // como o TSE publica
      "electorate": 270154,
      "turnout": 215564,
      "votes": { "13": 56423, "22": 131895, "55": 5143 }, // por número de urna; sem os zerados
      "ballots": { "valid": 206854, "blank": 2722, "null": 5988 },
      "sections": { "total": 723, "counted": 723 },
      "updatedAt": "2026-10-05T12:51:05-03:00",
    },
  ],
  "fetchedAt": "2026-10-05T15:00:00.000Z",
  "stale": false,
}
```

| Status | Quando                                  | `cache-control`                                                             |
| ------ | --------------------------------------- | --------------------------------------------------------------------------- |
| 200    | 2º turno, dados frescos                 | `public, s-maxage=60, stale-while-revalidate=60, stale-if-error=600`        |
| 200    | 1º turno (resultado final)              | `public, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=86400` |
| 200    | `stale: true`                           | `public, s-maxage=5`                                                        |
| 503    | TSE fora e nenhum dado em memória       | `no-store` + `retry-after: 60`                                              |
| 400    | `uf` ausente ou inválida, `round` ≠ 1/2 | `no-store`                                                                  |

## `GET /api/history?scope=…`

Como a apuração do **2º turno** evoluiu numa abrangência: um ponto por atualização do total nacional (ADR 0011). Schema: [`packages/contracts/src/history.ts`](../packages/contracts/src/history.ts).

`scope`: `br` (padrão), `zz` (exterior), a UF em minúsculas (`sp`) ou `regiao-<código>` (`regiao-n`, `regiao-ne`, `regiao-co`, `regiao-se`, `regiao-s`). Regiões são somadas no servidor.

```jsonc
{
  "scope": { "kind": "state", "code": "SP" },
  "points": [
    {
      "at": "2026-10-25T17:12:00-03:00", // horário de totalização do TSE
      "counted": 1200, // seções apuradas
      "total": 102000, // seções totais
      "votes": { "13": 61000, "22": 58000 }, // por número de urna
    },
  ],
  "fetchedAt": "2026-10-25T20:13:00.000Z",
  "stale": false,
}
```

O front usa `paceOf` (`packages/domain`) para o ritmo (seções/min e previsão de 100%) e acrescenta à curva os pontos recebidos no polling de `/api/results`.

| Status | Quando                                      | `cache-control`                                                      |
| ------ | ------------------------------------------- | -------------------------------------------------------------------- |
| 200    | Histórico lido                              | `public, s-maxage=60, stale-while-revalidate=60, stale-if-error=600` |
| 200    | `stale: true` (Blob fora, cópia em memória) | `public, s-maxage=5`                                                 |
| 503    | Blob fora e nenhuma cópia em memória        | `no-store` + `retry-after: 60`                                       |
| 400    | `scope` desconhecido                        | `no-store`                                                           |
| 405    | Método diferente de GET/HEAD                | `no-store`                                                           |
