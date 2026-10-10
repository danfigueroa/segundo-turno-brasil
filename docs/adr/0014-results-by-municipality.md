# 0014 — Votação por cidade

- Status: aceita
- Data: 2026-10-10

## Contexto

O seuimposto.com mostra, além de estados e regiões, o resultado de cada município. O TSE publica um arquivo de resultado por município (`dados/<uf>/<uf><código>-c0001-e<eleição>-u.json`, cerca de 9 KB, ou 2,4 KB com gzip): são 5.571 municípios no Brasil. Não há arquivo por estado com os votos de cada cidade. Por município existem apenas:

- `config/mun-e<eleição>-cm.json`: a lista de municípios com o código do TSE, o código do IBGE e o nome;
- `dados/<uf>/<uf>-e<eleição>-ab.json`: o andamento (seções apuradas, horário da totalização), sem votos.

Ler os 5.571 arquivos a cada atualização é inviável num proxy que roda poucas vezes por minuto. Por isso, o mapa nacional por município (cerca de 1 MB de malha) foi descartado.

## Decisão

- **Cidades sob demanda, por estado:** nova rota `GET /api/cities?uf=xx&round=1|2`, chamada pelo front só com um estado ou uma cidade aberta.
  - Cache do 2º turno: `s-maxage=60`, como `/api/abroad`. 1º turno: 1h. Fallback `stale` com `GetLatest`, um por estado.
  - Resposta compacta: `MunicipalityResult` com código do IBGE, nome, eleitorado, comparecimento, votos por candidato (sem os zerados), brancos, nulos e seções. Nome e partido dos candidatos vêm do tally do estado; o front monta o `Tally` da cidade com `municipalityTally`.
- **Busca incremental** (`TseCitiesSource`):
  - lê o arquivo de andamento do estado e só baixa de novo os municípios cujo andamento mudou desde a última leitura daquela instância;
  - a lista de municípios é lida uma vez;
  - com a função fria, baixa todos, com até 32 requisições simultâneas e `maxDuration` de 60s.
  - Medido no 1º turno: MG (853 municípios) leva cerca de 4–7s frio e cerca de 0,1s incremental; a resposta tem cerca de 47 KB gzip.
  - Se o arquivo de andamento não existir (no 2º turno, o de RR só é publicado quando a apuração começa), todos os municípios são baixados.
  - Um arquivo de resultado atrás do seu andamento (atraso do CDN) é baixado de novo na leitura seguinte.
- **Malhas por estado pré-projetadas no build** (`pnpm --filter @stb/web map:cities`):
  - fonte: IBGE em qualidade mínima, salva em `apps/web/data/municipios`;
  - um módulo JSON por estado (`*.generated.json`), carregado com `import.meta.glob`: um chunk com hash e cache imutável, baixado só com o estado aberto. O maior é MG, com cerca de 61 KB gzip.
- **Cidade como abrangência:**
  - URL `#/ba/2927408` (o código do IBGE começa pelo código da UF, e isso é validado);
  - migalhas Brasil › Nordeste › Bahia › Salvador;
  - card completo com as duas linhas de números-chave e o botão "Compartilhar Salvador".
  - O compartilhamento desenha o mapa municipal do estado com a cidade contornada.
  - Não há histórico por município: a análise da apuração fica oculta para a cidade.
- **Mapa municipal no lugar do mapa do Brasil** com um estado ou uma cidade aberta: mesmas cores, faixas e legenda dos estados.
  - Tocar num município seleciona a cidade.
  - O mapa municipal escreve o nome da cidade selecionada acima dela e tem um seletor nativo "Ir para uma cidade" ao lado do de estado, para escolher a cidade sem rolar até a lista.
  - A lista "Votação por cidade" (busca, maiores eleitorados primeiro) substitui a lista de estados e é o caminho por teclado e leitor de tela, já que centenas de formas não podem receber foco.

## Consequências

- Até 27 estados × 2 turnos de funções diferentes, cada uma no máximo cerca de 1x/min. Com a função quente, cada execução lê só o que mudou.
- Banda: abrir um estado custa a malha (até cerca de 61 KB, uma vez por navegador) mais os dados (até cerca de 47 KB no 1º turno e menos no 2º), atualizados a cada minuto só enquanto o estado está aberto.
- Malhas e fixtures (AC, AP e RR, nos dois turnos) entram no repositório. Se o IBGE criar municípios, é preciso rodar `map:cities --download` de novo.
- É uma exceção ao design pedida pelo dono do projeto. Falta levá-la ao Claude Design.
