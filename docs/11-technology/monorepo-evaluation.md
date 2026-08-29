# TECH-MONO-001

| Campo       | Valor              |
| ----------- | ------------------ |
| Document ID | Avaliação monorepo |
| Prompt      | 10                 |

## Estrutura candidata

```text
cisne-rondonia/
  apps/
    api/          # NestJS
    web/          # Vite React
  packages/
    domain-*/     # por BC ou agrupamento
    shared-kernel/
    contracts/    # DTOs compartilhados tipados
  turbo.json
  pnpm-workspace.yaml
```

## Opções

| Opção                | Score | Resultado                      |
| -------------------- | ----- | ------------------------------ |
| **pnpm + Turborepo** | 4.12  | **Selecionado**                |
| pnpm simples         | 4.05  | Alternativa se Turbo excesso   |
| npm workspaces       | 3.70  | Rejeitado — performance        |
| Nx                   | 3.95  | Rejeitado — complexidade early |
| Polirepo             | 3.20  | Rejeitado — tipos duplicados   |

## pnpm

- Disco eficiente (hard links)
- `workspace:` protocol
- Strict node_modules — menos phantom deps

## Turborepo

- Cache tarefas build/test/lint em CI
- Pipeline `dependsOn` entre packages
- Menor curva que Nx para time pequeno

## Nx — por que não

Generators, graph — overhead para fase FOUNDATION→primeira implementação. Revisitar se >10 devs.

## npm workspaces — por que não

Mais lento; hoisting menos previsível que pnpm.

## Package manager lock

`pnpm-lock.yaml` versionado; política em version-policy.md.
