# BOOT-ENV-001

| Campo       | Valor                      |
| ----------- | -------------------------- |
| Document ID | Pré-requisitos de ambiente |
| Prompt      | 16                         |
| Verificação | 2026-08-29                 |

## Runtime verificado nesta máquina

| Componente | Requerido (ADR)       | Detectado                            | Status        |
| ---------- | --------------------- | ------------------------------------ | ------------- |
| Node.js    | 24.x LTS              | **v24.14.0**                         | OK            |
| pnpm       | 9.x                   | via `npx pnpm@9.15.9` (global EPERM) | OK com npx    |
| npm        | —                     | 11.9.0                               | OK (fallback) |
| PostgreSQL | 18.x (Prompt 17)      | não exigido no bootstrap             | N/A           |
| Docker     | Testcontainers futuro | não verificado                       | N/A           |

## Instalação pnpm (desenvolvedor)

```powershell
corepack enable
corepack prepare pnpm@9.15.9 --activate
```

Se EPERM no Windows, usar:

```powershell
npm install -g pnpm@9.15.9
```

Ou sempre: `npx pnpm@9.15.9 <comando>`.

## Versões pinadas (package.json / lockfile)

| Pacote         | Range / pin        |
| -------------- | ------------------ |
| Node engines   | `>=24.0.0 <25.0.0` |
| packageManager | `pnpm@9.15.9`      |
| TypeScript     | ^5.8.3             |
| NestJS         | ^11.1.x            |
| React          | ^19.1.x            |
| Vite           | ^7.0.0             |
| Vitest         | ^3.2.x             |
| Turborepo      | ^2.5.x             |

Lockfile `pnpm-lock.yaml` registra versões exatas pós `pnpm install`.

## ADRs aplicados

ADR-TECH-001..003, 006, 007 ACCEPTED. Drizzle/PG (004/005) **não** instalados neste prompt.
