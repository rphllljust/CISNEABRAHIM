# AUTHZ-ROLE-001

| Campo       | Valor                          |
| ----------- | ------------------------------ |
| Document ID | Papéis empresariais candidatos |
| Total       | 16 (ROLE-CAND-001..016)        |
| Prompt      | 08                             |

> **Nenhum papel definitivo.** Não mapear 1:1 a roles técnicas futuras.

| ID            | Nome candidato                   | ACT         | Descrição                                        | Status                    |
| ------------- | -------------------------------- | ----------- | ------------------------------------------------ | ------------------------- |
| ROLE-CAND-001 | Solicitante                      | ACT-001     | Cria solicitações no escopo permitido            | CANDIDATE                 |
| ROLE-CAND-002 | Autorizador empresarial          | ACT-002     | Alçada para liberar, decidir, cancelar candidato | PENDING_BUSINESS_DECISION |
| ROLE-CAND-003 | Preparador de OS                 | ACT-005     | Elabora rascunho/preparação                      | CANDIDATE                 |
| ROLE-CAND-004 | Executor                         | ACT-003     | Executa serviço em campo/operação                | CANDIDATE                 |
| ROLE-CAND-005 | Responsável pela OS              | ACT-004     | Custódia operacional da OS atribuída             | AMBIGUOUS                 |
| ROLE-CAND-006 | Planejador de recursos           | ACT-005     | Planeja e aloca recursos                         | CANDIDATE                 |
| ROLE-CAND-007 | Preparador de medição            | ACT-006     | Submete medição                                  | CANDIDATE                 |
| ROLE-CAND-008 | Aprovador de medição             | ACT-006     | Decide medição — **distinto** de 007 (SoD)       | PENDING_BUSINESS_DECISION |
| ROLE-CAND-009 | Preparador de faturamento        | ACT-007     | CMD-019                                          | CANDIDATE                 |
| ROLE-CAND-010 | Registrador de nota              | ACT-007     | CMD-020                                          | PENDING_BUSINESS_DECISION |
| ROLE-CAND-011 | Registrador de pagamento         | ACT-007     | CMD-021                                          | PENDING_BUSINESS_DECISION |
| ROLE-CAND-012 | Gestor comercial                 | ACT-008     | Preço, proposta, referência                      | PENDING_SOURCE_VALIDATION |
| ROLE-CAND-013 | Visualizador financeiro restrito | ACT-007     | Custo/margem (SEC-REQ-009)                       | PENDING_BUSINESS_DECISION |
| ROLE-CAND-014 | Custodiante documental           | ACT-005/007 | Anexos, substituição CMD-022                     | CANDIDATE                 |
| ROLE-CAND-015 | Administrador técnico            | ACT-010     | TI — **sem** poder empresarial automático        | CANDIDATE                 |
| ROLE-CAND-016 | Gestor de acesso candidato       | ACT-010     | Provisiona contas — SoD com financeiro           | PENDING — DDP-015         |

## Papéis explicitamente rejeitados

| Nome rejeitado         | Motivo                                         |
| ---------------------- | ---------------------------------------------- |
| Superadmin empresarial | Proibido pelo Prompt 08                        |
| Admin (genérico)       | Confunde técnico e empresarial (naming-policy) |
| Usuário                | Vago — usar papel de negócio                   |

## Compatibilidade candidata (não confirmada)

Uma pessoa física pode acumular múltiplos ROLE-CAND **exceto** onde SOD-* marca CONFLICT — decisão empresarial ADP-001.
