# Segundo Turno Brasil

Acompanhe **ao vivo** a apuração do 2º turno da eleição presidencial de **25/10/2026**: placar nacional, por região e por estado, num mapa do Brasil interativo e animado, com imagens prontas para compartilhar nos Stories.

- Mapa coroplético: cada estado na cor de quem lidera, mais intenso quanto maior a vantagem.
- Navegação Brasil / Região / Estado, com link compartilhável (`/#/sp`, `/#/regiao/ne`).
- Mobile first: bottom sheet ao tocar num estado, alvos de toque de 44px, tema claro/escuro.
- Compartilhamento: imagem 1080×1920 (Stories) ou 1080×1350 (Feed) gerada no aparelho, enviada pela folha de compartilhamento nativa (Instagram, WhatsApp…) ou baixada.
- Dados oficiais do TSE, atualizados a cada ~20s, com fallback quando o TSE oscila.

## Como rodar

Requisitos: Node 22 (`.nvmrc`) e pnpm 10 (`corepack enable` instala a versão de `packageManager`).

```bash
pnpm install
cp apps/api/.env.example apps/api/.env   # DATA_SOURCE=simulation por padrão
pnpm dev                                 # web em http://localhost:5173, API em :3001
```

### Fontes de dados (`DATA_SOURCE`)

| Valor        | Uso                                                                            |
| ------------ | ------------------------------------------------------------------------------ |
| `simulation` | Replay "ao vivo" do 1º turno de 2026 com só os 2 finalistas — ideal para UI.   |
| `fixture`    | Resultado final do 1º turno de 2026, estático (offline).                       |
| `tse`        | TSE ao vivo (produção). Use `TSE_ELECTION_CODE=6257` para ver o 1º turno real. |

Todas as variáveis estão em [`apps/api/.env.example`](apps/api/.env.example).

## Scripts

| Comando                            | O que faz                                                    |
| ---------------------------------- | ------------------------------------------------------------ |
| `pnpm dev`                         | API (tsx watch) + web (Vite) em paralelo                     |
| `pnpm test`                        | Vitest em todos os pacotes                                   |
| `pnpm lint`                        | ESLint                                                       |
| `pnpm format:check`                | Prettier                                                     |
| `pnpm typecheck`                   | `tsc` em todos os pacotes                                    |
| `pnpm build`                       | Build da web + `.vercel/output` (Build Output API da Vercel) |
| `pnpm --filter @stb/web map:build` | Regera o mapa pré-projetado a partir do IBGE                 |

## Estrutura

```
apps/api           API (Vercel Functions): TSE → domínio → JSON cacheado no CDN
apps/web           React + Vite: placar, mapa, tabela, compartilhamento
packages/domain    Regras puras: UFs, regiões, agregação, liderança
packages/contracts Contrato da API (zod/mini), usado pelo back e pelo front
docs/              Arquitetura, API, dados do TSE, frontend e ADRs
```

## Deploy

Projeto Vercel (plano Hobby) apontando para a raiz do repositório. O `vercel.json` roda `pnpm build`, que gera `.vercel/output` — a Vercel publica esse diretório como está. Detalhes em [docs/architecture.md](docs/architecture.md).

## Documentação

- [Arquitetura](docs/architecture.md)
- [API](docs/api.md)
- [Dados do TSE](docs/tse-data.md)
- [Frontend](docs/frontend.md)
- [Decisões de arquitetura (ADRs)](docs/adr/)

## Aviso

Site independente, sem vínculo com o TSE ou com candidatos. Os resultados oficiais são os publicados pelo [TSE](https://resultados.tse.jus.br).

## Licença

[GPL-3.0](LICENSE)
