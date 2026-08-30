# Prompt 19 — Seed seguro e bootstrap controlado

| Campo  | Valor |
| ------ | ----- |
| Prompt | 19    |
| Escopo | Persistência técnica de identidade (Prompt 18) |

## Separação obrigatória

| Módulo | Localização | Uso |
| ------ | ----------- | --- |
| `DEVELOPMENT_SEED` | `packages/database/src/seed/development-seed.ts` | `NODE_ENV=development` apenas |
| `TEST_DATA_BUILDERS` | `packages/database/src/test-builders/` | Testes de integração |
| `PRODUCTION_BOOTSTRAP` | `packages/database/src/seed/production-bootstrap.ts` | CLI manual explícita |

## DEVELOPMENT_SEED

- Login fictício fixo: `dev-operator@cisne-rondonia.invalid` (RFC 2606 `.invalid`)
- Senha: `DEV_SEED_PASSWORD` (`.env` local) **ou** gerada em runtime
- **Nunca** commitada em código
- Idempotente: segunda execução retorna `already_exists`
- Resultado JSON: `outcome`, `login`, `identityId`, `message` — **sem** senha/hash

```powershell
# Após migrations
$env:NODE_ENV='development'
$env:DEV_SEED_PASSWORD='Dev-Only-1!Synthetic'  # opcional
pnpm db:seed:dev
```

## SYNTHETIC_BUSINESS_SEED (development / homologation)

Massa sintética determinística para telas, filtros e fluxo vertical. **Proibido em produção.**

Pré-condições:

- `NODE_ENV=development` e `DATABASE_URL` apontando a `cisne_local_dev` em host local
- `DEVELOPMENT_SYNTHETIC_SEED_CONFIRM=I_UNDERSTAND`
- Operador DEV existente (`pnpm auth:repair:dev-login`)

Homologação: `CISNE_ENV=hml`, database `cisne_hml`, `HML_SYNTHETIC_SEED_CONFIRM=I_UNDERSTAND`.

```powershell
$env:DEVELOPMENT_SYNTHETIC_SEED_CONFIRM='I_UNDERSTAND'
$env:SEED_REFERENCE_DATE='2026-08-01T12:00:00-04:00'  # opcional
pnpm db:seed:synthetic
```

Namespace: `cisne-synthetic-dev-v1` via `external_erp_id` e prefixo `TESTE —` nos nomes.

Idempotente: reexecução retorna `already_present` por cenário.

## TEST_DATA_BUILDERS

`IdentityTestBuilders` produz dados `@cisne.invalid` isolados:

| Builder | Resultado |
| ------- | --------- |
| `activeIdentity()` | Identidade ativa + credencial |
| `disabledIdentity()` | Status `disabled` + `disabled_at` |
| `validCredential()` | Identidade + credencial válida |
| `validSession()` | Sessão ativa |
| `expiredSession()` | Sessão `expired` |
| `revokedSession()` | Sessão `revoked` |

Sem CPF, CNPJ, e-mail ou telefone reais.

## PRODUCTION_BOOTSTRAP

- **Não** roda no startup da API
- **Não** cria conta padrão
- Exige variáveis explícitas + confirmação
- Rejeita senha fraca (`validatePasswordStrength`)
- Rejeita se já existir qualquer identidade no banco
- Sem roles/permissões empresariais

```powershell
$env:BOOTSTRAP_ADMIN_LOGIN='admin@example.invalid'
$env:BOOTSTRAP_ADMIN_PASSWORD='Str0ng!Bootstrap-99'
$env:BOOTSTRAP_CONFIRM='I_UNDERSTAND'
pnpm bootstrap:first-identity
```

## Variáveis

| Variável | Obrigatória | Contexto |
| -------- | ----------- | -------- |
| `DEV_SEED_PASSWORD` | Não | Dev seed (local `.env`) |
| `BOOTSTRAP_ADMIN_LOGIN` | Sim (bootstrap) | Produção manual |
| `BOOTSTRAP_ADMIN_PASSWORD` | Sim (bootstrap) | Produção manual |
| `BOOTSTRAP_CONFIRM` | Sim (bootstrap) | Deve ser `I_UNDERSTAND` |
| `DATABASE_URL` | Sim | Conexão PG |

Ver `.env.example` — nomes apenas, sem valores secretos.

## Segurança

| Regra | Implementação |
| ----- | ------------- |
| Sem senha em código | Hash via `scrypt` em runtime |
| Sem hash em resposta | `SafeSeedResult` tipado |
| Seed proibido em produção | `assertDevelopmentOnly` |
| Bootstrap manual | CLI `bootstrap:first-identity` |
| Política de senha | ≥12 chars, classes mistas, padrões fracos bloqueados |

## Testes

| Suite | Arquivo | Cobertura |
| ----- | ------- | --------- |
| Unit | `seed/password-policy.spec.ts` | Senha fraca/forte |
| Integração | `seed.bootstrap.integration.spec.ts` | Idempotência, isolamento, bootstrap, vazamento |

Comandos:

```powershell
pnpm test
pnpm test:integration
```

## Limitações

- Hash `scrypt` custom — não bcrypt/argon2 (Prompt 20 pode alinhar com IdP)
- Bootstrap produção não valida e-mail real vs fictício (operador responsável)
- Sem seed automático no `pnpm dev`
- Sem papéis empresariais (Prompt 21+)

## Comandos de validação

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm build
```
