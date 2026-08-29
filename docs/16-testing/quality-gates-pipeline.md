# QA-GATE-001

| Campo       | Valor                     |
| ----------- | ------------------------- |
| Document ID | Quality gates pipeline CI |
| Prompt      | 15                        |

## Pipeline candidato (Turborepo)

```text
lint → typecheck → test:unit → test:integration → test:security → build
        ↓ (main only)
     test:e2e → audit:deps
```

## Gates por estágio

| Gate                    | Critério                        | Bloqueia merge |
| ----------------------- | ------------------------------- | -------------- |
| G-01 Lint               | ESLint 0 errors                 | ✓              |
| G-02 Types              | tsc strict                      | ✓              |
| G-03 Unit               | L1-L2 PASS                      | ✓              |
| G-04 Integration        | L3-L4 PASS; PG real             | ✓              |
| G-05 Critical TEST-CAND | 001–012,014,017–022,041,045,047 | ✓              |
| G-06 Security subset    | SEC-TEST CRITICAL mapped        | ✓ main         |
| G-07 Concurrency        | 003,006,009,020 PASS            | ✓ release      |
| G-08 E2E smoke          | 053–056                         | ✓ release      |
| G-09 pnpm audit         | no critical                     | ✓              |
| G-10 Coverage           | **no minimum %**                | —              |

## TEST-CAND CRITICAL set

```text
001,002,003,005,006,008,009,011,012,014,017,018,019,020,
021,022,023,024,025,041,045,047
```

## Pre-release financeiro

- TXN-TEST-001..015 + SEC-TEST CRITICAL all PASS.

## Pre-prod

E2E 053–056 + ZAP baseline staging.

## Falha gate

| Ação                         |     |
| ---------------------------- | --- |
| Block deploy                 |     |
| Notify                       |     |
| No skip `--no-verify` policy |     |

## FOUNDATION

Gates documentados — **pipeline NOT STARTED** até Prompt 16.
