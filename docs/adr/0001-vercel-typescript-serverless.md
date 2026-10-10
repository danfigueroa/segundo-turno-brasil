# 0001 — Vercel + TypeScript serverless

- Status: aceita
- Data: 2026-10-10

## Contexto

A proposta inicial era Go + React na Cloudflare (plano gratuito). Os Workers não rodam Go nativamente (só via TinyGo/WASM), e o Containers é pago. O tráfego será concentrado numa única noite, com pico alto.

## Decisão

Hospedar na Vercel (Hobby) com funções serverless em TypeScript e React no front.

## Consequências

- O backend é um proxy fino cacheado pelo CDN: a performance da linguagem é irrelevante; Go não traria ganho.
- Um só toolchain e um **contrato de tipos único** entre back e front (`packages/contracts`).
- Hobby: uso não comercial, 100 GB de banda/mês, cron só diário (por isso a atualização é dirigida pelo cache — ADR 0002).
