# AUTHZ-ADP-001

| Campo | Valor |
| --- | --- |
| Document ID | Decisões pendentes de autorização |
| Total | 14 (ADP-001..014) |
| Prompt | 08 |

| ID | Questão | DDP/SEC | Opções | Status |
| --- | --- | --- | --- | --- |
| ADP-001 | Uma pessoa pode acumular ROLE-CAND? | DDP-015 | Sim com exceções / Não / Por função | OPEN |
| ADP-002 | Quem tem GLOBAL_SCOPE? | SEC-REQ-019 | Direção / Ninguém / Auditoria | OPEN |
| ADP-003 | Modelo de delegação formal | — | Período / OS / Cliente | OPEN |
| ADP-004 | Exceção temporária a SoD | SEC-REQ-014 | Permitir auditado / Proibir | OPEN |
| ADP-005 | Dados pessoais — base legal e escopo | NFR-010 | Mínimo operacional / Consentimento | OPEN |
| ADP-006 | Responsável vê preço operacional? | — | Sim / Não / Parcial | OPEN |
| ADP-007 | Admin técnico acessa backup de docs RESTRITO? | SEC-REQ-010 | Infra criptografado / Proibido | OPEN |
| ADP-008 | Alterar preço pós-faturamento | SEC-REQ-007 | Proibido / Alçada máxima | OPEN |
| ADP-009 | Procedimento break-glass | — | Formalizar / Não existir | OPEN |
| ADP-010 | Quem atribui ROLE-CAND | DDP-015 | RH / TI / Gestão | OPEN |
| ADP-011 | Imutabilidade SECURITY_AUDIT | SEC-REQ-024 | WORM / DB append-only | OPEN |
| ADP-012 | Responsável = Executor — SoD | DDP-032 | Permitir / Separar | OPEN |
| ADP-013 | Alçada liberação — critérios | DDP-003 | Crédito / PO / Agenda | OPEN |
| ADP-014 | Isolamento por cliente vs unidade | SEC-REQ-019 | CLIENT / UNIT / Híbrido | OPEN |

## DDPs upstream bloqueantes

DDP-003, DDP-015, DDP-022, DDP-012 — sem resposta, AUTHZ permanece CANDIDATE/PENDING.

## BOD relacionados

BOD-001 (ACKNOWLEDGED) — impacta AUTHZ-007, não confundir com autorização de liberação.
