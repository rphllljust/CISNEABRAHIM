# TECH-QUAL-001

| Campo       | Valor                         |
| ----------- | ----------------------------- |
| Document ID | Avaliação qualidade e tooling |
| Prompt      | 10                            |

## Stack de qualidade selecionada

| Ferramenta                          | Função                   | Momento       |
| ----------------------------------- | ------------------------ | ------------- |
| **TypeScript** `strict`             | Type checking            | Implementação |
| **ESLint** (flat config)            | Lint                     | Implementação |
| **Prettier**                        | Formatação               | Implementação |
| **Husky** + **lint-staged**         | Pre-commit               | Implementação |
| **Turborepo**                       | Lint/test/build pipeline | Monorepo      |
| **GitHub Actions** (ou equivalente) | CI futura                | TECH-DDP-006  |

## ESLint

- `@typescript-eslint` recommended + strict candidato
- Regras import boundaries entre packages (futuro eslint-plugin-boundaries)
- Sem regras de negócio no lint

## Prettier

- Único formatador; evita debates
- Integração ESLint via eslint-config-prettier

## Type checking

- `tsc --noEmit` em CI
- Project references entre packages monorepo

## Commit hooks

- lint-staged: eslint + prettier em arquivos alterados
- Não rodar test suite completa no pre-commit (lento)

## CI futura (candidata)

```text
install → turbo lint → turbo typecheck → turbo test → turbo build
```

## Editor

`.editorconfig` já existe (neutro).

## Não selecionado ainda

SonarQube, CodeQL, dependency audit automation — TECH-DDP-007.
