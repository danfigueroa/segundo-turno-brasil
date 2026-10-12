# 0021 — Primeiro paint antes do JavaScript

- Status: aceita
- Data: 2026-10-12

## Contexto

Antes, o `index.html` chegava com o `#root` vazio. No celular, a tela ficava em branco até o JS (~113 KB gzip) baixar e rodar, e a fonte só era descoberta depois do CSS. A meta é Lighthouse mobile ≥ 90 e LCP < 2,5 s em 4G.

## Decisão

- **Pré-renderizar a tela de carregamento** no build: `src/shell.tsx` renderiza `LoadingScreen` (cabeçalho + "Carregando resultados…", a mesma tela que o React mostra enquanto espera os dados) com `renderToStaticMarkup`, num build SSR do Vite. Depois, `scripts/prerender-shell.ts` escreve esse HTML no `#root` de `dist/index.html` e apaga o build SSR.
- O React continua com `createRoot` (sem hidratação) e substitui o conteúdo pré-renderizado. Não existe estado a reconciliar e não há risco de erro de hidratação.
- **Preload do woff2 latino** por um plugin do Vite, que acha o arquivo com hash no bundle e falha o build se ele sumir.
- **Carregar sob demanda** o que não aparece na abertura: listas por cidade e por país e Vercel Analytics.
- **Prefetch** do chunk da malha municipal no `pointerdown` de uma UF.

## Consequências

- O primeiro paint passa a depender só do HTML e do CSS, e mostra o desenho de verdade (são os mesmos componentes e as mesmas classes).
- Mudar o cabeçalho muda também o HTML estático, sem trabalho extra: ele vem do mesmo componente.
- O build da web faz duas passadas do Vite. A segunda leva ~40 ms.
