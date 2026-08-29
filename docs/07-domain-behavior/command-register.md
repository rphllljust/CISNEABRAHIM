# DBEH-CMD-REG-001

| Campo | Valor |
| --- | --- |
| Document ID | Registro de comandos empresariais |
| Total | 22 (CMD-001..CMD-022) |
| Prompt | 06 |

> Nomes em português imperativo. Sem HTTP, DTO ou handler.

## Índice

| ID | Nome empresarial | BC owner | FR | Status |
| --- | --- | --- | --- | --- |
| CMD-001 | Registrar solicitação | BC-005 | FR-001 | CANDIDATE |
| CMD-002 | Decidir sobre solicitação | BC-005 | FR-006 | PENDING_BUSINESS_DECISION |
| CMD-003 | Converter solicitação em OS | BC-006 | FR-009 | CANDIDATE |
| CMD-004 | Preparar conteúdo da OS | BC-006 | FR-011 | CANDIDATE |
| CMD-005 | Liberar OS | BC-006 | FR-014 | CANDIDATE |
| CMD-006 | Atribuir responsável pela OS | BC-006 | FR-015 | CANDIDATE |
| CMD-007 | Confirmar recebimento da OS | BC-006 | FR-016 | PENDING_BUSINESS_DECISION |
| CMD-008 | Iniciar execução | BC-008 | FR-017 | CANDIDATE |
| CMD-009 | Registrar progresso de execução | BC-008 | FR-018 | CANDIDATE |
| CMD-010 | Concluir OS | BC-008/006 | FR-019 | CANDIDATE |
| CMD-011 | Cancelar OS | BC-006 | FR-020 | CANDIDATE |
| CMD-012 | Reabrir OS | BC-006 | FR-021 | PENDING_BUSINESS_DECISION |
| CMD-013 | Alterar informação da OS | BC-006 | FR-022 | CANDIDATE |
| CMD-014 | Planejar recursos da OS | BC-007 | FR-013 | CANDIDATE |
| CMD-015 | Alocar recurso | BC-007 | FR-025 | CANDIDATE |
| CMD-016 | Anexar evidência de execução | BC-009 | FR-040 | CANDIDATE |
| CMD-017 | Submeter medição | BC-010 | FR-036 | CANDIDATE |
| CMD-018 | Decidir sobre medição | BC-010 | FR-037 | PENDING_BUSINESS_DECISION |
| CMD-019 | Preparar faturamento | BC-011 | FR-038 | CANDIDATE |
| CMD-020 | Registrar documento de faturamento informado | BC-012 | FR-039 | CANDIDATE |
| CMD-021 | Registrar pagamento | BC-013 | — | PENDING_BUSINESS_DECISION |
| CMD-022 | Substituir documento | BC-014 | FR-042 | CANDIDATE |

---

## CMD-005 — Liberar OS (detalhe representativo)

| Campo | Valor |
| --- | --- |
| Nome empresarial | Liberar OS |
| Intenção | Autorizar execução operacional da OS |
| Contexto owner | BC-CAND-006 |
| Ator | Autorizador empresarial (TERM-007) |
| Alvo | Ordem de Serviço (TERM-002) |
| Dados mínimos | Identificador OS; ato de autorização candidato |
| Pré-condições | PRED-001; INV-002 |
| Invariantes | INV-002, INV-012 (se PO aplicável) |
| Autorização | SEC-REQ-003; alçada DDP-003 |
| Resultado | OS elegível para execução; DE-004 |
| Rejeições | REJ-002, REJ-003, REJ-011 |
| Eventos candidatos | DE-004 ServiceOrderReleased |
| Efeito financeiro | Habilita medição/faturamento futuros |
| Transação | STRONG_WITHIN_BOUNDARY |
| Concorrência | EXCLUSIVE_RESOURCE |
| Repetição | UNIQUE_BUSINESS_OPERATION |
| Idempotency scope | ator + operação + alvo (OS id) |
| Auditabilidade | AUDIT_TRAIL + DOMAIN_HISTORY |
| Status | CANDIDATE |

## CMD-003 — Converter solicitação em OS

| Campo | Valor |
| --- | --- |
| Intenção | Criar OS a partir de solicitação decidida |
| Pré-condições | Solicitação registrada; INV-001, INV-003 |
| Resultado | OS criada; DE-003 |
| Transação | STRONG_TRANSACTIONAL |
| Idempotência | UNIQUE_BUSINESS_OPERATION |
| Eventos | DE-003 |
| Rejeições | REJ-001, REJ-014 |
| Status | CANDIDATE |

## CMD-015 — Alocar recurso

| Campo | Valor |
| --- | --- |
| Intenção | Vincular recurso a item planejado |
| Pré-condições | PRED-002; INV-004 |
| Transação | STRONG_WITHIN_BOUNDARY |
| Concorrência | EXCLUSIVE_RESOURCE |
| Eventos | DE-007 |
| Rejeições | REJ-005 |
| Status | CANDIDATE |

## CMD-020 — Registrar documento de faturamento informado

| Campo | Valor |
| --- | --- |
| Intenção | Registrar nota/fatura informada externamente |
| Pré-condições | INV-007, INV-011 |
| Transação | STRONG_WITHIN_BOUNDARY |
| Idempotência | IDEMPOTENCY_REQUIRED |
| Efeito financeiro | CRITICAL |
| Eventos | DE-014 |
| Rejeições | REJ-010 |
| Status | CANDIDATE |

Demais comandos: estrutura equivalente; ver [command-event-causality.md](./command-event-causality.md) e [transaction-classification.md](./transaction-classification.md).
