# 0013 — Mapa-múndi das cidades no exterior

- Status: aceita; o mapa de pontos foi substituído pela ADR 0017
- Data: 2026-10-10

## Contexto

O seuimposto.com, referência no 1º turno, mostra o exterior num mapa-múndi com um ponto por cidade. Até aqui o Exterior tinha só a lista por país (ADR 0008), e o mapa continuava sendo o do Brasil, com todos os estados apagados. O TSE já publica o exterior por cidade (186 arquivos), e `/api/abroad` lia todos eles para somar por país, mas descartava as cidades. A tabela cidade → país não tinha coordenadas, e o repositório não tinha geometria do mundo.

## Decisão

- **Coordenadas na tabela** `adapters/tse/abroad-cities.ts`: `lat`/`lon` com uma casa decimal, tiradas do OpenStreetMap (Nominatim) pelo script `pnpm --filter @stb/api geocode:abroad` e revisadas à mão. Elas só mudam se o TSE mudar a lista de cidades.
- **`/api/abroad` passa a devolver também `cities`**: código, nome do TSE, país, continente, coordenadas, eleitorado, votos por candidato e seções. Os países passam a ser somados no domínio (`aggregateCountries`), a partir das cidades, tanto no TSE quanto na simulação, e por isso os dois níveis sempre batem. O port `AbroadSource` passa a ter um único método, `fetchAbroad()`, que devolve `{ countries, cities }`.
- **Mapa pré-projetado no build** (`pnpm --filter @stb/web map:world`):
  - usa as terras do Natural Earth 1:110m (pacote `world-atlas`, sem a Antártida) e o Brasil em destaque;
  - projeção Equal Earth, gerando `world-map.generated.json` com cerca de 13 KB gzip;
  - o JSON guarda a escala e a translação da projeção. O navegador posiciona as cidades com a fórmula do Equal Earth (`features/world-map/project.ts`, cerca de 10 linhas), sem d3. Um teste garante que ela é idêntica ao `geoEqualEarth` do d3-geo.
- **`WorldMap` com `lazy()`**: substitui o mapa do Brasil só com o Exterior aberto, num chunk fora do bundle inicial (ADR 0005).
  - Ponto com área proporcional ao eleitorado, na cor de quem lidera e com a intensidade da margem (as mesmas faixas e a mesma legenda dos estados). Cinza antes de haver votos ou em caso de empate.
  - Os nomes das maiores cidades aparecem sem se sobrepor.
- **Pontos são uma figura, não botões**: num celular, as cidades da Europa ficam a poucos pixels umas das outras, sem alvo de toque possível. Por isso o grupo de pontos tem `role="img"` com um resumo ("Lula lidera em N cidades…"), e a lista "Votação por país" continua sendo o caminho acessível até os números. O botão "Voltar ao Brasil" (44px) faz o papel do botão Exterior do mapa do Brasil.

## Consequências

- `/api/abroad` cresce de cerca de 23 KB para cerca de 60 KB sem compressão (cerca de 6 KB a mais em gzip), na mesma rota com 60s de cache. As requisições ao TSE não mudam.
- É uma exceção ao design pedida pelo dono do projeto, assim como a análise da apuração. Falta levá-la ao Claude Design.
