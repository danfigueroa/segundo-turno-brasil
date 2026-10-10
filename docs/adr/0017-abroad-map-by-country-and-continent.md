# 0017 — Mapa do exterior por país, um continente por vez

- Status: aceita (substitui a ADR 0016 e o mapa de pontos da ADR 0013)
- Data: 2026-10-10

## Contexto

O mapa-múndi com um ponto por cidade (ADR 0013), mesmo com zoom por continente (ADR 0016), ficava pequeno no card. Os círculos destoavam do resto do site, onde estados, regiões e municípios são áreas pintadas.

## Decisão

- **Países pintados** como os estados: cada país com seção eleitoral na cor de quem lidera, com a intensidade pela margem (mesmas faixas e legenda). Os demais países ficam num cinza mais claro, e o Brasil num cinza escuro, como referência. Os votos vêm de `CountryResult` (`/api/abroad`), sem mudança na API.
- **Um continente por vez**, sem visão do mundo inteiro: chips Américas, Europa, Ásia e Oceania e África (`CONTINENT_CODES`). A Europa abre primeiro, porque tem o maior eleitorado no exterior (412 mil em 2026).
- **Uma malha por continente** (`pnpm --filter @stb/web map:world`):
  - Natural Earth 1:50m (`world-atlas`), em projeção azimutal equivalente centrada numa caixa fixa de longitude e latitude, que cobre todas as cidades com seção eleitoral do continente e corta o resto;
  - simplificada com `topojson-simplify`, descartando detalhes abaixo de meio pixel na escala do continente;
  - escrita em `src/features/world-map/maps/<continente>.generated.json` (22–36 KB gzip), num chunk carregado só quando o continente é aberto.
- **Nomes dos países:** o TSE escreve os nomes em português. O script tem a tabela nome do TSE → código ISO numérico e falha se algum país de `abroad-cities.ts` ficar sem forma no seu continente. A Guiana Francesa é separada da França, porque o Natural Earth junta as duas.
- **Países minúsculos** (Singapura, Bahrein, Barbados, Santa Lúcia…) ganham um marcador redondo com a cor do país, para não sumirem.
- **Nomes no mapa:** os países com mais seções primeiro (8 no desktop, 5 no celular), sem sobreposição e sem passar das bordas (`country-labels.ts`). Só ganham nome e marcador os países do continente aberto; vizinhos cortados na borda (o Marrocos na Europa) são pintados, mas ficam sem nome.

## Consequências

- O mapa ocupa a largura toda do card, e cada país tem tamanho legível, inclusive no celular.
- Não há mais cidades no mapa. As coordenadas de `abroad-cities.ts` continuam na API (`cities` em `/api/abroad`), mas a web não as usa.
- O JS inicial não muda: o componente e as malhas são carregados sob demanda.
- Continua sendo uma exceção ao Claude Design; falta levá-la ao desenho.
