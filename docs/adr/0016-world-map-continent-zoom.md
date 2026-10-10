# 0016 — Zoom por continente no mapa-múndi

- Status: substituída pela ADR 0017
- Data: 2026-10-10

## Contexto

O mapa-múndi do Exterior (ADR 0013) mostra o mundo inteiro na largura do card. No desktop, ele ocupa uma faixa baixa, e no celular cerca de 330 px. As cidades da Europa (Lisboa, Porto, Londres, Paris…) e da costa leste dos EUA viram um aglomerado de pontos sobrepostos, e só 6 cidades ganham nome.

## Decisão

- **Chips de continente** acima do mapa: Mundo, Américas, Europa, Ásia e Oceania e África. São os mesmos continentes e o mesmo estilo de chip do filtro da "Votação por país" (`CONTINENT_CODES`). A escolha é local ao card: não vai para a URL nem filtra a lista.
- **Recorte calculado das cidades** (`viewport.ts`): a caixa que envolve as cidades do continente, com folga de 40 unidades e largura mínima de 260. O formato fica entre quadrado e o do mundo, dentro dos limites do mundo. Com as 186 cidades, o zoom vai de cerca de 2,3× (Ásia e Oceania) a 3,9× (Europa). Não há caixas fixas por continente: se o TSE mudar a lista, o recorte acompanha.
- **Transição** de 600 ms do `viewBox` em `requestAnimationFrame` (`use-tweened-view-box.ts`), sem biblioteca. Com `prefers-reduced-motion`, a troca é instantânea.
- **Escala:** a ampliação vai para o CSS em `--scale`. Nomes, contornos e bordas dividem por ela e mantêm o tamanho na tela. Os pontos crescem só pela raiz da ampliação, para que os aglomerados se separem. Com um continente aberto, até 8 cidades ganham nome (no mundo, 6), e um nome que passaria da borda direita vai para a esquerda do ponto. Cidades de outros continentes que caem no recorte ficam esmaecidas.
- O SVG passa a cortar o que fica fora do `viewBox` (`overflow: hidden`).

## Consequências

- Os aglomerados ficam legíveis no celular sem pinch-zoom (ainda pendente para o site todo).
- O JS inicial não muda: tudo fica no chunk do mapa-múndi, carregado sob demanda.
- É mais uma exceção ao Claude Design, pedida como o próprio mapa-múndi; falta levá-la ao desenho.
