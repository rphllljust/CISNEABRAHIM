# QA-STRAT-001

| Campo | Valor |
| --- | --- |
| Document ID | Estratégia de testes |
| Prompt | 15 |

## Missão

Proteger **regras empresariais confirmadas ou candidatas** contra regressão — especialmente financeiro, SoD, concorrência e integridade transacional.

## Não é objetivo

| Anti-meta | Motivo |
| --- | --- |
| 80% line coverage como meta | Não prova invariantes |
| Mockar PostgreSQL para UNQ/CHK | Falso positivo |
| E2E só happy path | Miss negativo e corrida |
| Dados prod em CI | SEC-RISK-010 |

## Pirâmide adaptada (regras críticas)

```text
        ┌─────────┐
        │ E2E UC  │  Poucos — jornadas WF-001..006
       ┌┴─────────┴┐
       │ API integ │  CMD + AuthZ + PG real
      ┌┴───────────┴┐
      │ Domain unit │  INV, SM guards, VOs
     ┌┴─────────────┴┐
     │ DB constraint │  UNQ/CHK migration smoke
     └───────────────┘
```

## Priorização

1. CRITICAL INV (001, 002, 007, 010, 011)
2. FINANCIAL_RACE + IDEMPOTENCY (Prompt 13)
3. SEC-TEST CRITICAL (Prompt 14)
4. SoD / AUTHZ negativa
5. SM illegal transitions
6. Performance — fase posterior

## Ferramentas (ADR-TECH-007)

| Nível | Ferramenta |
| --- | --- |
| Unit domínio | Vitest |
| Integração API+PG | Vitest + Supertest + Testcontainers |
| E2E | Playwright |
| Security SAST | Semgrep/CodeQL CI candidato |
| Contract | OpenAPI snapshot + Pact candidato TBD |

## Definition of Test Ready (candidato)

- INV/CMD com TEST-CAND atribuído
- Dado sintético definido em test-data-strategy.md
- Nível e gate CI indicados

## Quando implementar

Prompt 16+ bootstrap — **nenhum arquivo de teste neste prompt**.
