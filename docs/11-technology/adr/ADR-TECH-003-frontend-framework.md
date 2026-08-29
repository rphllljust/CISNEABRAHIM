# ADR-TECH-003 — Framework frontend

| Campo  | Valor        |
| ------ | ------------ |
| ID     | ADR-TECH-003 |
| Status | **ACCEPTED** |
| Data   | 2026-08-28   |

## Contexto

TOPO-002 separa SPA e API. SSR não demonstrado como requisito. PWA pendente. App operacional interno candidato.

## Decisão

Adotar **React 19** com **Vite 7** como stack frontend (SPA).

**Não** adotar Next.js na seleção inicial.

## Drivers

TOPO-002; scorecard 4.22; TECH-DDP-001 SSR aberto.

## Alternativas

| Alternativa  | Resultado                           |
| ------------ | ----------------------------------- |
| Next.js      | Rejeitado — SSR desnecessário agora |
| Vue 3 + Vite | Rejeitado — split stack skills      |
| Angular      | Rejeitado                           |

## Benefícios

- Dev experience Vite
- Tipos compartilhados com API
- Deploy estático possível

## Custos

- SEO/SSR manual se necessário depois
- Roteamento client-side (React Router candidato)

## Riscos

TECH-RISK-008; TECH-DDP-003 PWA.

## Consequências

- `apps/web` no monorepo
- API REST/JSON consumida pelo cliente

## Reversibilidade

Média — migração para Next possível mas rework.

## Sinais para revisão

- TECH-DDP-001 fecha com SSR obrigatório
- Requisito SEO público confirmado

## Documentos relacionados

- [frontend-evaluation.md](../frontend-evaluation.md)
