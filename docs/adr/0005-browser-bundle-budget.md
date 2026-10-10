# 0005 — Orçamento do bundle do navegador

- Status: aceita
- Data: 2026-10-10

## Contexto

O primeiro build tinha 159 KB gzip de JS. A maioria do público acessa pelo celular.

## Decisão

- `packages/contracts` usa `zod/mini` com `import * as z` (tree-shakeable): de ~93 KB para ~9 KB gzip. O backend continua com zod clássico para o schema do TSE.
- Números animados com tween próprio em `requestAnimationFrame`; `motion` fica restrito a animações de entrada/saída (`LazyMotion` + `m`). _Atualização (ADR 0007): o bottom sheet saiu e o `motion` com ele; JS inicial ≈ 115 KB gzip._
- Mapa pré-projetado em build (sem d3/topojson no navegador).

## Consequências

JS inicial ≈ 138 KB gzip, dominado pelo React DOM. Próximos passos possíveis: servir o mapa como asset estático separado para cache independente entre deploys.
