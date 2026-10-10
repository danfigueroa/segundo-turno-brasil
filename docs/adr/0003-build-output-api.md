# 0003 — Empacotar com a Build Output API da Vercel

- Status: aceita
- Data: 2026-10-10

## Contexto

Funções em `api/` são compiladas pela própria Vercel. Os pacotes do workspace exportam TypeScript (`src/index.ts`) com imports sem extensão, o que é frágil num runtime ESM do Node compilado arquivo a arquivo.

## Decisão

`scripts/build-vercel-output.mjs` gera `.vercel/output` (Build Output API v3): estáticos do Vite e cada função empacotada pelo esbuild num único `index.mjs` (Node 22). A função é um handler Fetch API adaptado para Node (`toNodeListener`), o mesmo usado no servidor local.

## Consequências

- O artefato de deploy é determinístico e testável localmente (importar `index.mjs` e chamar).
- Novas funções precisam ser registradas em `FUNCTIONS` no script.
- Rotas, cabeçalhos e fallback SPA ficam em `config.json`, gerado pelo mesmo script.
