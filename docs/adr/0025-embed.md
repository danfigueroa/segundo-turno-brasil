# 0025 — Visão incorporável (embed)

- Status: aceita
- Data: 2026-10-12

## Contexto

Blogs e portais podem mostrar o placar ao vivo e levar leitores ao site.

## Decisão

- `/?embed#/<abrangência>` (`lib/embed.ts`) mostra só o card de resultado, com polling, ou a contagem regressiva antes do 2º turno, e o botão "Acompanhe ao vivo em …", que abre o site completo na mesma abrangência numa nova aba.
- No desktop, o diálogo de compartilhamento oferece "Copiar código para incorporar no seu site": um `<iframe>` de 620 px de altura com `loading="lazy"`.
- Os cabeçalhos de segurança não bloqueiam iframes (não há `X-Frame-Options` nem `frame-ancestors`). A página não tem ações sensíveis, então clickjacking não é um risco relevante.

## Consequências

- Cada visualização embutida carrega o mesmo JS (~113 KB gzip, depois em cache) e faz polling como o site. Um portal grande pode pesar na banda do plano Hobby: acompanhar no painel da Vercel e, se preciso, remover o botão.
- O Vercel Analytics conta essas visualizações.
