# Frontend

React 19 + Vite, organizado por funcionalidade em `apps/web/src/features`.

## Turnos

- Abas **2º turno** / **1º turno** (`features/round-tabs`). O turno vai no hash (`#/1turno/sp`, `#/2turno`).
- Sem turno no endereço, `resolveRound` (`lib/view.ts`) mostra o **1º turno enquanto a apuração do 2º não começou** e muda sozinho para o 2º quando a primeira seção é totalizada — o site nunca fica vazio.
- O 2º turno é sempre carregado (é o dado ao vivo e decide o padrão); o 1º turno é buscado só quando exibido, uma vez (`staleTime: Infinity`, sem polling).
- No 1º turno, o placar mostra os dois finalistas, os **demais candidatos** num `<details>` e a barra inclui os demais em cinza — o marcador de 50% passa a ser o limite de maioria absoluta. O mapa usa os mesmos dois finalistas (em 2026 todas as UFs e o exterior foram liderados por eles).
- Antes da apuração do 2º turno: selo "Aguardando", contagem regressiva até 17h de 25/10 (`features/countdown`) e atalho para o 1º turno; sem barra de abrangência nem lista de estados.

## Dados e estado

- `api/use-results.ts`: TanStack Query por turno; o 2º turno tem polling de 20s, pausado com a aba oculta, e `keepPreviousData` para não piscar.
- Resposta validada com o schema de `@stb/contracts` (zod/mini, ~9 KB gzip).
- Turno e seleção (Brasil / região / UF / exterior) vivem no hash da URL (`lib/use-view.ts`: `#/sp`, `#/regiao/ne`, `#/exterior`): links compartilháveis e botão voltar funcionam.

## Identidade visual

Desenho de referência no Claude Design (ADR 0007). Tokens em `styles/tokens.css`:

- Verde `#00843D` e amarelo `#FFD60A` da bandeira (faixa no topo e no rodapé, marca), fundo `#F5F6F1`, texto `#0F1A14`.
- Fonte Schibsted Grotesk auto-hospedada (`@fontsource-variable/schibsted-grotesk`).
- Só tema claro, com as cores exatas do desenho (o tema escuro do sistema é ignorado).
- Textos e casas decimais seguem o desenho em cada tamanho de tela: "Toque…" no celular, "Clique…" no desktop; vantagem com 1 casa no celular e 2 na tabela do desktop.

## Página

1. **Cabeçalho:** marca, selo de status (Resultado final / Aguardando / Ao vivo / Apuração encerrada) e, no desktop, as abas de turno; no celular as abas ficam numa linha própria (`lib/use-media-query.ts`).
2. **Barra de abrangência** fixa no topo (`features/scope-chips`): Brasil, regiões e Exterior. Com um estado selecionado, o chip da região dele fica marcado como "pai".
3. **Card de resultado** (`features/result-card`): migalhas (Brasil › Nordeste › Bahia) e % apurado; avatares com iniciais, selo "Lidera"/"Mais votado"; barra com o marcador de 50%; três números-chave e o botão "Compartilhar …". A lógica fica em `headline.ts` (testada). Numa **região**, o card mostra quantos estados cada finalista lidera.
4. **Mapa** (`features/map`): seletor de estado (com Exterior) e legenda em grade.
5. **Lista de estados** (`features/states-list`): cartões no celular, grade tipo tabela no desktop; no Brasil começa recolhida (8 no celular, 10 no desktop). Em região/estado mostra os estados da região. Escondida no Exterior.

Escolher uma abrangência em qualquer lugar rola até o card de resultado, se ele estiver fora da tela.

## Finalistas e cores

- `lib/finalists.ts`: os dois primeiros nacionais, em **ordem fixa por número de urna**. A cor segue o candidato e nunca a posição: uma virada não troca lados nem cores.
- Vermelho `#D92D20` e azul `#1F5FD1` (claro) / `#EF5A4C` e `#4B83E8` (escuro); para texto, `#B42318` e `#1A4FB5` (contraste 4,5:1).
- Mapa: escala divergente por **margem em pontos percentuais**, em 5 faixas (`<2`, `2–5`, `5–10`, `10–20`, `20+`), cada passo também mais escuro (lê-se sem cor). Cinza para "sem votos" ou empate.
- Ao escolher uma região, os outros estados esmaecem; ao escolher um estado, os vizinhos de região ficam a meio-tom (`features/map/emphasis.ts`).
- Nomes do TSE vêm sem acento: `formatName` corrige os conhecidos ("Flávio").
- Cor nunca é a única pista: tooltip, `aria-label` por estado e a tabela trazem os números.

## Mapa

- Malha das UFs do IBGE (qualidade "mínima") em `data/br-uf.topo.json`.
- `scripts/build-map.ts` projeta (Mercator) e grava caminhos SVG em `brazil-map.generated.json` (~14 KB gzip): o navegador não carrega d3 nem topojson.
- Estados são botões acessíveis por teclado (Enter/Espaço); tooltip no hover (mouse) e no foco.
- **Votos no exterior** (escopo `zz` do TSE, já somados ao total do Brasil) aparecem como um botão "Exterior" sobre o Atlântico, na mesma escala de cores e com ≥ 44px. Também há chip na barra de abrangência e opção no seletor.
- Siglas dos estados só no desktop.

## Mobile

- Layout de uma coluna até 960px; acima disso, card de resultado e mapa lado a lado e a lista de estados embaixo.
- Tocar num estado troca o card de resultado e rola até ele.
- Alvos de toque ≥ 44px, `safe-area-inset`, `prefers-reduced-motion` respeitado (números e transições).
- Números animados por um tween próprio em `requestAnimationFrame` (sem re-render do React).

## Compartilhamento

`features/share`:

1. `share-content.ts` resolve o que mostrar a partir da seleção atual.
2. `render-share-image.ts` desenha em Canvas 2D — reaproveitando os caminhos do mapa via `Path2D` — em 1080×1920 (Stories, conteúdo fora dos ~250px de topo/base) ou 1080×1350 (Feed). Segue o card de Stories do desenho: faixa verde com o losango da bandeira, card branco com o placar, mapa com quantos estados cada um lidera e rodapé com fonte e endereço. Sempre no tema claro; a fonte é carregada (`document.fonts.load`) antes de desenhar.
3. `ShareDialog` (carregado sob demanda) gera o PNG **antes** do toque em "Compartilhar", porque o Safari só permite `navigator.share` dentro do gesto do usuário.
4. Sem suporte a compartilhar arquivos (desktop): "Baixar imagem".

Não existe API web para postar direto nos Stories; a folha nativa do sistema oferece o Instagram.

## Orçamento de performance

JS inicial ≈ 115 KB gzip (React DOM ≈ 69 KB, mapa ≈ 14 KB, zod/mini ≈ 9 KB), CSS ≈ 7 KB, fonte ≈ 47 KB (woff2, subconjunto latino). O diálogo de compartilhamento é um chunk separado.
