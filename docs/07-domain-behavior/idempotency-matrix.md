# DBEH-IDEM-001

| Campo | Valor |
| --- | --- |
| Document ID | Matriz de idempotência |
| Prompt | 06 |

| CMD | Sensibilidade | Scope candidato | Identificador externo | Janela |
| --- | --- | --- | --- | --- |
| CMD-001 | IDEMPOTENCY_REQUIRED | ator + operação + payload hash candidato | opcional cliente | UNKNOWN |
| CMD-003 | UNIQUE_BUSINESS_OPERATION | solicitação id | — | — |
| CMD-005 | UNIQUE_BUSINESS_OPERATION | OS id + operação liberar | — | — |
| CMD-008 | UNIQUE_BUSINESS_OPERATION | OS id | — | — |
| CMD-010 | UNIQUE_BUSINESS_OPERATION | OS id | — | — |
| CMD-013 | SAFE_REPEAT | OS id + versão esperada | — | — |
| CMD-015 | UNIQUE_BUSINESS_OPERATION | recurso + item + OS | — | — |
| CMD-016 | SAFE_REPEAT / IDEM | hash arquivo candidato | — | PENDING |
| CMD-017 | IDEMPOTENCY_REQUIRED | medição scope + OS item | — | UNKNOWN |
| CMD-020 | IDEMPOTENCY_REQUIRED | nota ref externa + origem | TERM-048 | UNKNOWN |
| CMD-021 | IDEMPOTENCY_REQUIRED | pagamento ref externo | obrigatório se SoT ext. | UNKNOWN |
| CMD-022 | UNIQUE_BUSINESS_OPERATION | documento lógico + versão | — | — |
| Consultas | SAFE_REPEAT | — | — | — |

Scope `UNKNOWN` quando fonte não define janela ou chave — DDP-037.
