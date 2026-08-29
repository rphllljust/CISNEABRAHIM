# QA-CONC-001

| Campo       | Valor                  |
| ----------- | ---------------------- |
| Document ID | Testes de concorrência |
| Prompt      | 15                     |

## Obrigatório — operações críticas

| Operação             | TEST-CAND | Técnica                   |
| -------------------- | --------- | ------------------------- |
| Conversão SR→OS      | 003       | `Promise.all` 2× POST     |
| row_version OS       | 006       | 2× PATCH mesmo version    |
| PO saldo             | 009       | 2× consumo paralelo       |
| Alocação recurso     | 020       | 2× CMD-015 mesmo resource |
| Faturamento dup      | 041       | 2× CMD-019                |
| Doc version          | 035       | 2× CMD-022                |
| Concluir vs cancelar | 029       | race CMD-010/011          |

## Ambiente

- PG real — serialização/deadlock reais
- CI: `--pool=forks` ou single worker para testes race tagged `@concurrency`
- Retry test infrastructure flakiness — max 2 no CI; investigar se persiste

## Assert

| Resultado              | Aceito   |
| ---------------------- | -------- |
| 1 sucesso + 1 REJ/409  | ✓        |
| 2 sucesso dup          | **FAIL** |
| Lost update silencioso | **FAIL** |

## OPT vs PESS

| Cenário         | Esperado           |
| --------------- | ------------------ |
| OPT row_version | 409 segundo writer |
| PESS allocation | REJ-005 segundo    |
| PESS PO         | REJ-011 segundo    |

## Não usar

Mock repository com in-memory lock — não substitui TEST-CAND 009,020.

## Tagging

`@concurrency` — roda em job dedicado sequencial se flaky.
