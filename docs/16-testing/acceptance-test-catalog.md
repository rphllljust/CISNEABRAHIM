# QA-ACC-001

| Campo       | Valor                  |
| ----------- | ---------------------- |
| Document ID | Catálogo testes aceite |
| Prompt      | 15                     |

> Aceite = jornada UC verificável por negócio — automatizada E2E onde possível.

| UC     | Título                | TEST-CAND   | Nível | Critério aceite candidato      |
| ------ | --------------------- | ----------- | ----- | ------------------------------ |
| UC-001 | Registrar solicitação | 036,053     | L3/L6 | SR criada; dup bloqueada       |
| UC-005 | Converter em OS       | 001,002,053 | L3/L6 | 1 OS por SR                    |
| UC-008 | Liberar OS            | 005,010,054 | L4/L6 | OS LIBERADA; sem alçada negado |
| UC-009 | Executar OS           | 039,054     | L4/L6 | Execução só pós liberação      |
| UC-015 | Alocar recurso        | 019,020     | L3    | Sem dupla alocação             |
| UC-019 | Consumir PO           | 008,009     | L3    | Saldo respeitado               |
| UC-021 | Submeter medição      | 017,055     | L3/L6 | Medição registrada             |
| UC-022 | Preparar faturamento  | 041,055     | L4/L6 | Prep com origem                |
| UC-023 | Registrar nota        | 011,056     | L3/L6 | NF única                       |
| UC-025 | Substituir documento  | 035,058     | L3/L4 | Versão preservada              |
| UC-026 | Consultar relatório   | backlog     | L8    | Eventual read — perf futuro    |

## WF cross-context

| WF     | TEST-CAND |
| ------ | --------- |
| WF-001 | 053       |
| WF-002 | 054       |
| WF-003 | 055       |
| WF-004 | 055       |
| WF-005 | 056       |

## Aceite manual

UC com PENDING_BUSINESS — aceite manual até TEST-CAND existir.

## Sign-off

Stakeholder sign-off **não** substitui TEST-CAND automatizado para INV CRITICAL.
