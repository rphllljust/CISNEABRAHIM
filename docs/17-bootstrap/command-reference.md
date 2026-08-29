# BOOT-CMD-001

| Campo       | Valor                  |
| ----------- | ---------------------- |
| Document ID | Referência de comandos |
| Prompt      | 16                     |

## Raiz (`package.json`)

| Script         | Turbo / ferramenta         | Descrição         |
| -------------- | -------------------------- | ----------------- |
| `install:deps` | pnpm                       | Alias documentado |
| `lint`         | `turbo run lint`           | ESLint            |
| `format`       | prettier --write (apps, packages, docs/17-bootstrap, raiz) | Formatar          |
| `format:check` | prettier --check (mesmo escopo)                          | Gate formatação   |
| `typecheck`    | `turbo run typecheck`      | TypeScript strict |
| `test`         | `turbo run test`           | Vitest            |
| `build`        | `turbo run build`          | Produção          |
| `dev`          | `turbo run dev --parallel` | Desenvolvimento   |

## @cisne/api

| Script    | Comando                       |
| --------- | ----------------------------- |
| build     | `nest build`                  |
| dev       | `nest start --watch`          |
| start     | `node dist/main.js`           |
| lint      | `eslint "{src,test}/**/*.ts"` |
| typecheck | `tsc --noEmit`                |
| test      | `vitest run`                  |

## @cisne/web

| Script    | Comando                |
| --------- | ---------------------- |
| build     | `tsc -b && vite build` |
| dev       | `vite`                 |
| lint      | `eslint src`           |
| typecheck | `tsc -b`               |
| test      | `vitest run`           |

## CI candidato (Prompt futuro)

```text
pnpm install --frozen-lockfile
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```
