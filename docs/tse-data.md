# Dados do TSE

Fonte: CDN pública de resultados `https://resultados.tse.jus.br/oficial/`. Os arquivos não têm CORS liberado — por isso só a nossa API acessa o TSE.

## Descobrindo as eleições

`/oficial/comum/config/ele-c.json` lista os pleitos. Em 2026 (ciclo `ele2026`), verificado em 10/10/2026:

| Código | Eleição                                                         |
| ------ | --------------------------------------------------------------- |
| 6257   | Federal 2026, 1º turno (04/10) — Presidente                     |
| 6258   | Federal 2026, **2º turno (25/10)** — Presidente (padrão da API) |

O arquivo do 2º turno já está publicado com os finalistas e votos zerados (Flávio Bolsonaro, 22 – PL; Lula, 13 – PT).

## Arquivo de resultado

```
{base}/{ciclo}/{eleição}/dados/{abr}/{abr}-c0001-e{eleição com 6 dígitos}-u.json
ex.: /oficial/ele2026/6258/dados/sp/sp-c0001-e006258-u.json
```

- `{abr}`: `br` (Brasil), `zz` (exterior) ou a UF em minúsculas.
- `c0001`: cargo Presidente.
- Cabeçalhos: `cache-control: max-age=56` — o TSE atualiza no máximo ~1x/min.

Campos usados (todos os números chegam como **string**; `""` antes da apuração):

| Campo                           | Significado                                                                        |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| `dt`/`ht`                       | Data/hora da totalização (vazios antes de começar)                                 |
| `dg`/`hg`                       | Data/hora de geração do arquivo (fallback)                                         |
| `carg[cd=1].agr[].par[].cand[]` | Candidatos: `n` (número), `nmu` (nome de urna), `vap` (votos); partido em `par.sg` |
| `s.ts` / `s.st`                 | Seções totais / totalizadas                                                        |
| `e.te` / `e.c`                  | Eleitorado / comparecimento                                                        |
| `v.vv` / `v.vb` / `v.tvn`       | Votos válidos / brancos / nulos                                                    |

Horários são de Brasília (UTC−3, sem horário de verão desde 2019).

Também existe `br/br-e{eleição}-ab.json` com o andamento de todas as UFs num único arquivo, mas **sem votos por candidato** — por isso buscamos os 29 arquivos.

## Exterior por cidade

O exterior (`zz`) também tem um arquivo por cidade com seção eleitoral — 186 em 2026, os mesmos códigos nos dois turnos:

```
{base}/{ciclo}/{eleição}/dados/zz/zz{cidade}-c0001-e{eleição com 6 dígitos}-u.json
ex.: /oficial/ele2026/6257/dados/zz/zz29254-c0001-e006257-u.json   (Abidjã)
```

A lista de cidades está em `{base}/{ciclo}/{eleição}/config/mun-e{eleição}-cm.json` (abrangência `zz`), **sem o país**. O país, o continente e as coordenadas de cada cidade estão em `apps/api/src/adapters/tse/abroad-cities.ts` (ADR 0008 e 0013). As coordenadas vêm do OpenStreetMap: `pnpm --filter @stb/api geocode:abroad` gera um JSON para revisar e copiar para a tabela. O formato do arquivo é o mesmo dos estados.

## Fixtures

| Pasta                                     | Conteúdo                                                 |
| ----------------------------------------- | -------------------------------------------------------- |
| `apps/api/test/fixtures/ele2026-6257`     | 1º turno 2026, 100% apurado (base de testes e simulação) |
| `apps/api/test/fixtures/ele2026-6258-pre` | 2º turno 2026 antes da votação (votos zerados)           |

As pastas também têm os 186 arquivos de cidades do exterior (`zz{cidade}.json`), só com os campos que lemos. Para baixá-los de novo:

```bash
pnpm --filter @stb/api fixtures:abroad 6257 test/fixtures/ele2026-6257
```

Invariantes testadas com dados reais: soma das 27 UFs + exterior = total nacional; soma dos países = total do exterior.
