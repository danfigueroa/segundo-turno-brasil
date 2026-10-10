# 0018 — Prévia de links com imagem estática

- Status: aceita
- Data: 2026-10-10

## Contexto

Um link do site colado no WhatsApp, Facebook, X ou LinkedIn não mostrava prévia: o `index.html` só tinha `description`. Essas redes leem as meta tags Open Graph do HTML. A ideia original era `GET /api/og`, uma imagem gerada no servidor com o placar do momento.

## Decisão

- **Meta tags** Open Graph (`og:title`, `og:description`, `og:image` 1200×630, `og:url`, `og:locale` etc.), `twitter:card` com `summary_large_image` e `<link rel="canonical">` no `index.html`.
- **URLs absolutas**, como as redes exigem: um plugin do Vite troca `%SITE_URL%` pelo domínio de produção, `VERCEL_PROJECT_PRODUCTION_URL` (que passa a ser o domínio próprio, quando houver), com `segundo-turno-brasil.vercel.app` como padrão.
- **Imagem estática** `public/og.png` com a identidade do site: logo, "Apuração ao vivo", título, as abrangências e o mapa do Brasil em tons de verde por região, sem cores de candidato, para não sugerir resultado. É gerada por `pnpm --filter @stb/web og:build` (HTML com a fonte do site, capturado pelo `playwright-core`) e versionada no repositório.

## Por que não o placar ao vivo, por enquanto

- O WhatsApp e o Facebook guardam a prévia de cada URL por horas ou dias: um placar na imagem logo fica velho e pode enganar.
- Gerar imagem no servidor exige satori/resvg (WebAssembly e fonte) empacotados pelo nosso build próprio (ADR 0003), com mais uma função e mais banda no plano Hobby.
- O compartilhamento de imagem com o placar do momento já existe no cliente (ADR 0004), e é o caminho para quem quer postar o resultado.

## Consequências

- Toda prévia mostra a mesma imagem e o mesmo texto, em qualquer abrangência (o hash da URL não chega ao servidor).
- Quem trocar o desenho da imagem roda `og:build` de novo, com um Chromium instalado (`npx playwright install chromium-headless-shell`) ou apontado em `CHROME_PATH`.
- `GET /api/og` com o placar continua possível no futuro, com uma URL que mude a cada atualização para driblar o cache das redes.
