# Frontend

React 19 + Vite, organizado por funcionalidade em `apps/web/src/features`.

## Dados e estado

- `api/use-results.ts`: TanStack Query, polling de 20s, pausado com a aba oculta, `keepPreviousData` para não piscar.
- Resposta validada com o schema de `@stb/contracts` (zod/mini, ~9 KB gzip).
- Seleção (Brasil / região / UF) vive no hash da URL (`lib/use-selection.ts`): links compartilháveis e botão voltar funcionam.

## Finalistas e cores

- `lib/finalists.ts`: os dois primeiros nacionais, em **ordem fixa por número de urna**. A cor segue o candidato e nunca a posição: uma virada não troca lados nem cores.
- Vermelho `#e34948` e azul `#2a78d6` (claro) / `#e66767` e `#3987e5` (escuro), validados para daltonismo (ΔE CVD 21,6 / 19,2) e contraste ≥ 3:1.
- Mapa: escala divergente por **margem em pontos percentuais**, em 5 faixas (`<2`, `2–5`, `5–10`, `10–20`, `20+`). Cinza para "sem votos" ou empate. No tema escuro a escala é invertida: margem pequena perto da superfície, margem grande brilhante.
- Cor nunca é a única pista: tooltip, `aria-label` por estado e a tabela trazem os números.

## Mapa

- Malha das UFs do IBGE (qualidade "mínima") em `data/br-uf.topo.json`.
- `scripts/build-map.ts` projeta (Mercator) e grava caminhos SVG em `brazil-map.generated.json` (~14 KB gzip): o navegador não carrega d3 nem topojson.
- Estados são botões acessíveis por teclado (Enter/Espaço); tooltip no hover (mouse) e no foco.

## Mobile

- Layout de uma coluna até 960px; duas colunas (mapa + placar fixo) acima disso.
- Tocar num estado abre um bottom sheet com o resultado, mantendo o mapa à vista.
- Alvos de toque ≥ 44px, `safe-area-inset`, `prefers-reduced-motion` respeitado (números e transições).
- Números animados por um tween próprio em `requestAnimationFrame` (sem re-render do React).

## Compartilhamento

`features/share`:

1. `share-content.ts` resolve o que mostrar a partir da seleção atual.
2. `render-share-image.ts` desenha em Canvas 2D — reaproveitando os caminhos do mapa via `Path2D` — em 1080×1920 (Stories, conteúdo fora dos ~250px de topo/base) ou 1080×1350 (Feed). Sempre no tema escuro.
3. `ShareDialog` (carregado sob demanda) gera o PNG **antes** do toque em "Compartilhar", porque o Safari só permite `navigator.share` dentro do gesto do usuário.
4. Sem suporte a compartilhar arquivos (desktop): "Baixar imagem".

Não existe API web para postar direto nos Stories; a folha nativa do sistema oferece o Instagram.

## Orçamento de performance

JS inicial ≈ 138 KB gzip (React DOM ≈ 69 KB, mapa ≈ 14 KB, zod/mini ≈ 9 KB, motion ≈ 9 KB), CSS ≈ 4 KB. O diálogo de compartilhamento é um chunk separado.
