# TECH-TEST-001

| Campo       | Valor                          |
| ----------- | ------------------------------ |
| Document ID | Avaliação ferramentas de teste |
| Prompt      | 10                             |

## Seleção

| Camada         | Ferramenta                                   | Uso                        |
| -------------- | -------------------------------------------- | -------------------------- |
| Unitário       | **Vitest**                                   | Domain, application, utils |
| Integração API | **Vitest** + **supertest** (ou Nest testing) | HTTP + DB testcontainer    |
| Integração DB  | **Testcontainers** (PostgreSQL) candidato    | Migrations reais           |
| E2E browser    | **Playwright**                               | Fluxos críticos UC         |
| Contrato       | Pendente                                     | TECH-DDP-005               |

## Comparativo unitário

| Ferramenta       | Score | Notas                          |
| ---------------- | ----- | ------------------------------ |
| Vitest           | 5     | Vite-native, ESM, rápido       |
| Jest             | 4     | Maduro; config ESM mais pesada |
| Node test runner | 3     | Mínimo; menos features         |

## Comparativo E2E

| Ferramenta | Score | Notas                    |
| ---------- | ----- | ------------------------ |
| Playwright | 5     | Multi-browser, trace, CI |
| Cypress    | 4     | DX boa; menos paralelo   |
| Selenium   | 2     | Legado                   |

## Pirâmide candidata

```text
        / E2E Playwright (poucos) \
       / Integração API+DB (médio) \
      / Unitário Vitest (muitos)     \
```

## Prioridade por risco

1. CMD financeiros (CMD-019..021)
2. AuthZ gates (DENY-*)
3. Transições SM críticas (TR-CAND-007, 027, 040)
4. Fluxos WF-001..006 integração

## Não implementar neste prompt

Sem `vitest.config`, sem testes — apenas decisão documentada.
