# TECH-VER-001

| Campo       | Valor               |
| ----------- | ------------------- |
| Document ID | Política de versões |
| Verificação | 2026-08-28          |
| Prompt      | 10                  |

## Princípios

1. **Produção:** apenas runtimes/LTS ou major DB com suporte ativo.
2. **Pin** em lockfile; ranges conservadores em `package.json` (quando existir).
3. Revisão trimestral de segurança; semestral de major upgrades.
4. Fontes oficiais apenas para verificação.

## Versões recomendadas (verificadas 2026-08-28)

| Componente           | Versão alvo                              | Fonte                                                          | Suporte            |
| -------------------- | ---------------------------------------- | -------------------------------------------------------------- | ------------------ |
| Node.js              | **24.x** Active LTS                      | [github.com/nodejs/Release](https://github.com/nodejs/Release) | Até 2028-04-30     |
| Node.js (CI preview) | 26.x Current                             | idem                                                           | LTS out/2026       |
| TypeScript           | **5.8+** (5.x latest stable)             | typescriptlang.org                                             | Seguir 5.x         |
| PostgreSQL           | **18.x** (18.6+)                         | postgresql.org                                                 | Suporte ativo      |
| React                | **19.x**                                 | react.dev                                                      | Stable             |
| NestJS               | **11.x** (última major estável na impl.) | nestjs.com                                                     | Verificar na impl. |
| Vite                 | **7.x**                                  | vite.dev                                                       | Verificar na impl. |
| Drizzle ORM          | **0.4x+**                                | orm.drizzle.team                                               | Verificar na impl. |
| pnpm                 | **9.x**                                  | pnpm.io                                                        | —                  |
| Turborepo            | **2.x**                                  | turborepo.com                                                  | —                  |
| Vitest               | **3.x**                                  | vitest.dev                                                     | —                  |
| Playwright           | **1.5x**                                 | playwright.dev                                                 | —                  |

> NestJS, Vite, Drizzle, Vitest, Playwright: pin exato definido no **primeiro** `package.json` (Prompt 11+), consultando npm registry oficial na data.

## Política de atualização

| Tipo                 | Janela            | Aprovação            |
| -------------------- | ----------------- | -------------------- |
| Patch segurança      | 7 dias            | Automática CI        |
| Minor deps           | 30 dias           | Tech lead            |
| Major runtime (Node) | Planejada         | ADR update           |
| Major PostgreSQL     | Janela manutenção | ADR + migration test |

## Node.js

- **Dev/Prod inicial:** 24 LTS
- **Não usar:** 20 (EOL abr/2026), ímpares (23, 25)
- **Avaliar 26 LTS** após out/2026

## PostgreSQL

- Preferir 18; mínimo 16 se restrição infra
- Não iniciar em 14 (EOL nov/2026)

## TypeScript

`strict: true`, `noUncheckedIndexedAccess` candidato, `exactOptionalPropertyTypes` avaliar.

## Registro de verificação

| Data       | Responsável | Notas                |
| ---------- | ----------- | -------------------- |
| 2026-08-28 | Prompt 10   | Node 24 LTS, PG 18.6 |
