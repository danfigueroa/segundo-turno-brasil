# 0004 — Imagens de compartilhamento geradas no cliente

- Status: aceita
- Data: 2026-10-10

## Contexto

Compartilhar nos Stories é requisito crítico. Gerar imagens no servidor consumiria invocações e banda do plano Hobby justamente no pico.

## Decisão

Desenhar a imagem em Canvas 2D no aparelho (chunk carregado sob demanda), reaproveitando os caminhos SVG do mapa via `Path2D`, e enviar com a Web Share API (`navigator.share({ files })`), com download como fallback.

## Consequências

- Custo zero de servidor; a imagem mostra exatamente os dados da tela.
- O arquivo é preparado antes do toque em "Compartilhar" (exigência do Safari de gesto do usuário).
- A prévia de links (Open Graph, `/api/og`) continua planejada no servidor, com cache no CDN.
