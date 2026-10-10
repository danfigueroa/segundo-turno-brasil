# 0010 — Vercel Web Analytics

- Status: aceita
- Data: 2026-10-10

## Contexto

Queremos saber quantas pessoas acompanham a apuração (visitas, páginas, países, dispositivos), sem cookies nem banner de consentimento e sem pesar no bundle.

## Decisão

- `@vercel/analytics` com o componente `<Analytics />` de `@vercel/analytics/react` em `main.tsx` (o app é Vite + React, não Next.js).
- O script é servido pela própria Vercel em `/_vercel/insights/script.js` (mesmo domínio, sem terceiros) e só envia dados em produção/preview na Vercel; em `pnpm dev` não coleta nada.
- Web Analytics precisa estar ativado no painel do projeto (aba Analytics).

## Consequências

- +1,4 KB gzip no JS inicial (≈ 118 KB no total).
- Sem cookies: não exige banner de consentimento.
- No plano Hobby há um limite mensal de eventos; se for ultrapassado no dia da eleição, a coleta para até o mês seguinte — o site não é afetado.
- Como a navegação usa o hash da URL (`#/sp`), as visitas aparecem agregadas na página `/`.
