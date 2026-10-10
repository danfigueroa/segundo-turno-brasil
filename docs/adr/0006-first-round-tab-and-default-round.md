# 0006 — Aba do 1º turno e turno padrão automático

- Status: aceita
- Data: 2026-10-10

## Contexto

Até a noite de 25/10, o 2º turno não tem votos: o site ficaria vazio nas semanas de maior expectativa. O resultado final do 1º turno (eleição 6257) está publicado no TSE.

## Decisão

- A API serve os dois turnos no mesmo endpoint (`?round=1|2`), cada um com sua fonte e seu `GetResults`. O 1º turno usa cache longo (1h, `stale` por 1 dia).
- O front tem abas de turno e guarda o turno no hash da URL. Sem turno explícito, mostra o 1º turno até a primeira seção do 2º ser totalizada e então muda sozinho.
- No 1º turno, o placar destaca os finalistas e lista os demais candidatos; o mapa usa as mesmas duas cores.

## Consequências

- O site tem conteúdo útil desde já e vira "ao vivo" automaticamente na noite da eleição, sem deploy.
- O 2º turno é sempre buscado (decide o padrão), mesmo com o 1º em exibição — custo baixo graças ao CDN.
- Se algum estado tivesse sido liderado por um terceiro candidato no 1º turno, o mapa (que compara só os finalistas) não o mostraria; não é o caso em 2026.
