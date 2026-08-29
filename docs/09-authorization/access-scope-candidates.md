# AUTHZ-SCOPE-001

| Campo       | Valor                        |
| ----------- | ---------------------------- |
| Document ID | Escopos de acesso candidatos |
| Prompt      | 08                           |

> Escopos descrevem **limites empresariais** — não claims JWT, não filtros SQL definitivos.

| Escopo            | Definição candidata                         | Exemplo de uso                 | Status                    |
| ----------------- | ------------------------------------------- | ------------------------------ | ------------------------- |
| OWN_RECORD        | Registros criados pelo próprio ator         | Solicitações de ACT-001        | CANDIDATE                 |
| ASSIGNED_RECORD   | Registros onde ator é responsável designado | OS com DE-005                  | AMBIGUOUS                 |
| CLIENT_SCOPE      | Dados de um cliente/contratante             | Multi-tenant futuro            | PENDING — SEC-REQ-019     |
| CONTRACT_SCOPE    | Dados vinculados a contrato/PO              | TERM-013, TERM-014             | PENDING_SOURCE_VALIDATION |
| UNIT_SCOPE        | Unidade operacional/filial                  | EV-080 parcial                 | UNKNOWN                   |
| OPERATIONAL_SCOPE | OS, execução, alocação                      | Campo e backoffice operacional | CANDIDATE                 |
| FINANCIAL_SCOPE   | Faturamento, nota, pagamento, custo         | ACT-007, ROLE-CAND-009..011    | PENDING_BUSINESS_DECISION |
| DOCUMENT_SCOPE    | Arquivos e versões documentais              | CMD-016, CMD-022               | CANDIDATE                 |
| GLOBAL_SCOPE      | Toda a organização                          | Direção candidata              | PENDING — risco elevado   |
| UNKNOWN           | Escopo não definido em fonte                | —                              | Explícito                 |

## Regras de composição (hipótese)

1. Escopo mais restritivo prevalece quando há interseção (menor privilégio candidato).
2. OPERATIONAL_SCOPE **não** inclui FINANCIAL_SCOPE automaticamente.
3. ASSIGNED_RECORD não expande a custo/margem (SEC-REQ-009).
4. GLOBAL_SCOPE exige justificativa e auditoria reforçada — ADP-002.

## Mapeamento candidato ROLE → escopo primário

| ROLE-CAND                   | Escopo primário                | Secundário                    |
| --------------------------- | ------------------------------ | ----------------------------- |
| 001 Solicitante             | OWN_RECORD, CLIENT_SCOPE?      | —                             |
| 002 Autorizador             | OPERATIONAL_SCOPE, UNIT_SCOPE? | —                             |
| 004 Executor                | ASSIGNED_RECORD                | OPERATIONAL_SCOPE             |
| 009..011 Financeiro         | FINANCIAL_SCOPE                | CONTRACT_SCOPE?               |
| 013 Visualizador financeiro | FINANCIAL_SCOPE (leitura)      | —                             |
| 015 Admin técnico           | — (infra apenas)               | **não** OPERATIONAL/FINANCIAL |
