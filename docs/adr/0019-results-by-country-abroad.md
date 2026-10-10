# 0019 — Resultado por país no exterior

- Status: aceita
- Data: 2026-10-10

## Contexto

Os estados e as cidades têm o próprio resultado: tocar num deles abre o card completo, com migalhas e compartilhamento. No exterior, o mapa por país (ADR 0017) e a lista "Votação por país" só mostravam a cor e os votos dos finalistas. `CountryResult` não tinha eleitorado, comparecimento, brancos nem nulos, que os números-chave do card exigem.

## Decisão

- **API:** `/api/abroad` passa a trazer, em cada cidade e em cada país, `turnout`, `ballots` (`valid`, `blank`, `null`) e `updatedAt`. O país também ganha `electorate`. O adaptador do TSE já lia esses números de cada arquivo de cidade e só os descartava. `aggregateCountries` soma tudo, e o `updatedAt` do país é o da cidade mais recente. A simulação escala comparecimento, brancos e nulos com o andamento.
- **Domínio:** `countryTally(country, abroad)` monta um `Tally` do país com os candidatos do exterior, como `municipalityTally` faz para a cidade. O escopo continua `abroad`: não há escopo "país" no domínio.
- **Seleção:** novo tipo `{ kind: 'abroadCountry', slug }`, na URL como `#/exterior/portugal`. O slug vem do nome em português, sem acentos (`countrySlug`). Até os países carregarem, o card mostra o exterior; um slug malformado cai no Exterior.
- **Interface:**
  - tocar num país do mapa ou numa linha da "Votação por país" seleciona o país e rola até o card, como nos estados;
  - o mapa contorna o país e mostra o continente dele, mesmo quando a escolha vem da lista ou de um link;
  - migalhas Brasil › Exterior › País, e o chip Exterior fica marcado como pai;
  - números-chave: Diferença, Demais candidatos ou Abstenção, e Seções apuradas, mais a segunda linha (válidos, comparecimento, brancos e nulos);
  - sem análise da apuração, como na cidade: não há histórico por país;
  - "Compartilhar Portugal" desenha o mapa do continente com o país contornado (o mesmo mapa de detalhe da cidade) e quantos países cada finalista lidera.

## Consequências

- A resposta de `/api/abroad` cresce cerca de 70 bytes por cidade e por país (3 KB com gzip), e continua buscada só com o Exterior aberto.
- O JS inicial praticamente não muda (+0,3 KB): o mapa do continente para compartilhar sai do mesmo cache e do mesmo chunk do mapa do exterior.
