# 0027 — Domínio de produção: eleicao.danielfigueroa.dev

- Status: aceita
- Data: 2026-10-12

## Contexto

O site precisava de um endereço próprio, mais fácil de divulgar que `segundo-turno-brasil.vercel.app`. O autor já tem o domínio `danielfigueroa.dev`, usado pelo site pessoal. As opções eram:

- **Caminho** (`danielfigueroa.dev/eleicao2026`): o site pessoal é estático e não repassa um caminho para a Vercel, onde estão as funções. Exigiria pôr um proxy na frente do domínio inteiro, mudar a base do Vite e os caminhos da API, das imagens e do embed, e expor o site pessoal ao pico da eleição.
- **Domínio novo** (`.com.br`): mais fácil de lembrar, mas com custo e prazo de registro, e os nomes óbvios já tinham dono.
- **Subdomínio** (`eleicao.danielfigueroa.dev`): sem custo e sem mudança no código.

## Decisão

- Domínio de produção **`eleicao.danielfigueroa.dev`**, adicionado ao projeto da Vercel e marcado como produção.
- Um registro de DNS do subdomínio aponta para a Vercel, com TTL curto, para que uma mudança perto da eleição se espalhe em minutos. O restante do domínio não muda.
- O certificado HTTPS é emitido e renovado pela Vercel.

## Consequências

- Trocar o domínio não exige mudar o código: as meta tags de prévia usam `VERCEL_PROJECT_PRODUCTION_URL` (ADR 0018), que passa a ser o domínio próprio a partir do primeiro deploy depois da troca. A imagem, o vídeo, o texto e o código de incorporação compartilhados também usam esse endereço, qualquer que seja o domínio aberto.
- `segundo-turno-brasil.vercel.app` continua respondendo.
- O endereço é mais longo de digitar do que um `.com.br`, mas a maior parte do tráfego deve chegar por links compartilhados. Um `.com.br` pode ser somado depois, apontando para o mesmo projeto.
