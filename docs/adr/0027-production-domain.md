# 0027 — Domínio de produção: eleicao.danielfigueroa.dev

- Status: aceita
- Data: 2026-10-12

## Contexto

O site precisava de um endereço próprio, mais fácil de divulgar que `segundo-turno-brasil.vercel.app`. O autor já tem o domínio `danielfigueroa.dev`, registrado na Hostinger (DNS em `dns-parking.com`), com o site pessoal no GitHub Pages. As opções eram:

- **Caminho** (`danielfigueroa.dev/eleicao2026`): o GitHub Pages só serve arquivos estáticos e não repassa um caminho para a Vercel, onde estão as funções. Exigiria mover o domínio inteiro para um proxy, mudar a base do Vite e os caminhos da API, das imagens e do embed, e expor o site pessoal ao pico da eleição.
- **Domínio novo** (`.com.br`): mais fácil de lembrar, mas com custo e prazo de registro, e os nomes óbvios já tinham dono.
- **Subdomínio** (`eleicao.danielfigueroa.dev`): sem custo e sem mudança no código.

## Decisão

- Domínio de produção **`eleicao.danielfigueroa.dev`**, adicionado ao projeto da Vercel e marcado como produção.
- Na Hostinger, um registro **`CNAME eleicao`** aponta para o destino que a Vercel indica para o projeto (`*.vercel-dns-017.com`), com **TTL de 300s**, para que uma mudança perto da eleição (por exemplo, pôr um CDN na frente) se espalhe em minutos.
- Os demais registros (`A @` e `CNAME www`, do GitHub Pages) ficam como estão.
- O certificado HTTPS é emitido e renovado pela Vercel (Let's Encrypt).

## Consequências

- O código não muda: as meta tags de prévia usam `VERCEL_PROJECT_PRODUCTION_URL` (ADR 0018), que passa a ser o domínio próprio a partir do primeiro deploy depois da troca. A imagem e o texto compartilhados usam o endereço da página aberta.
- `segundo-turno-brasil.vercel.app` continua respondendo.
- O endereço é mais longo de digitar do que um `.com.br`, mas a maior parte do tráfego deve chegar por links compartilhados. Um `.com.br` pode ser somado depois, apontando para o mesmo projeto.
- Pôr a Cloudflare na frente exigiria levar o DNS de todo o `danielfigueroa.dev` para ela.
