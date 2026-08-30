# QA-ENV-001

| Campo       | Valor                         |
| ----------- | ----------------------------- |
| Document ID | Estratégia ambientes de teste |
| Prompt      | 15                            |

## Ambientes

| Env     | PG                              | Uso testes                           |
| ------- | ------------------------------- | ------------------------------------ |
| local   | Docker compose / Testcontainers | dev + integration                    |
| CI      | Testcontainers ephemeral        | L3,L4,L7 cada push                   |
| staging | Dedicated PG (HML compose)        | E2E, ZAP, PERF, deploy smoke         |
| prod    | —                               | **sem testes automatizados escrita** |

## PostgreSQL real

| Contexto       | Implementação                                      |
| -------------- | -------------------------------------------------- |
| CI integration | `testcontainers/node` postgres:18                  |
| Local          | `docker compose -f docker-compose.test.yml` futuro |
| Migrations     | Same pipeline prod — drift detection               |

## IdP test

Keycloak realm `cisne-test` ou mock JWKS server — Prompt 20.

## Object storage

MinIO testcontainer para upload L4.

## Paralelismo CI

| Job         | Workers                  |
| ----------- | ------------------------ |
| unit        | parallel                 |
| integration | 1-2 (race tagged serial) |
| e2e         | 1                        |

## Secrets CI

GitHub secrets / vault — test DB password generated per run.

## Isolamento

Database per job ou schema `test_${GITHUB_RUN_ID}`.
