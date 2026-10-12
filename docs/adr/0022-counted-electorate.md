# 0022 — Eleitorado das seções apuradas

- Status: aceita
- Data: 2026-10-12

## Contexto

O card mostrava a abstenção como `eleitorado − comparecimento` e o comparecimento como `comparecimento / eleitorado`. Durante a apuração, o comparecimento só conta as seções já apuradas, mas o eleitorado é o total. Com metade das urnas apuradas, a abstenção aparecia perto de 60%. O "Decidido" de "Ainda dá virada?" usava o mesmo limite, que era seguro mas muito folgado.

## Decisão

- O TSE publica `e.est`, o eleitorado das seções totalizadas. O adaptador lê esse valor como `countedElectorate`, um campo opcional do `Tally` (`packages/domain`).
- **Opcional no contrato:** o CDN ainda pode servir respostas antigas sem o campo (o 1º turno fica até um dia em cache). Quando falta, `countedElectorateOf` usa o eleitorado total, como antes.
- `aggregate` soma o campo só quando todas as partes o têm. A simulação o escala com o progresso. Municípios e países do exterior não o têm.
- O card mede abstenção e comparecimento contra esse eleitorado. `outlook` limita os votos que faltam aos eleitores das seções não apuradas (`eleitorado − countedElectorate`).

## Consequências

- Abstenção e comparecimento ficam corretos durante a apuração, e o mapa de abstenção por estado passa a ser possível.
- "Decidido" aparece mais cedo, ainda com um limite que não depende de estimativa.
