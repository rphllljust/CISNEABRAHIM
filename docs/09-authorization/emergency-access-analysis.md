# AUTHZ-EMERG-001

| Campo       | Valor                               |
| ----------- | ----------------------------------- |
| Document ID | Acesso emergencial (break-glass)    |
| Prompt      | 08                                  |
| Status      | PENDING_BUSINESS_DECISION — ADP-009 |

## Situação

Necessidade operacional de bypass temporário de SoD ou escopo — **sem** inventar procedimento definitivo.

## Princípios candidatos

1. Emergência **não** é modo padrão do admin técnico.
2. Qualquer break-glass exige: motivo, aprovador posterior, prazo, auditoria reforçada.
3. Não usar emergência para alterar preço ou pagamento sem alçada máxima explícita.

## Cenários hipotéticos

| Cenário                  | Ator           | Risco                | Controle candidato             |
| ------------------------ | -------------- | -------------------- | ------------------------------ |
| Autorizador indisponível | Gestão ADP-009 | Paralisação          | Delegação formal preferível    |
| Falha integração nota    | ACT-011        | Dados inconsistentes | Manual com dupla validação     |
| Incidente segurança      | ACT-010        | Revogação contas     | Sem acesso a dados financeiros |

## Proibições

- Conta break-glass permanente com GLOBAL_SCOPE
- Superadmin empresarial irrestrito
- Emergência sem registro em SECURITY_AUDIT

## Relação SEC-REQ

SEC-REQ-020 — ações administrativas auditadas incluem emergência candidata.
