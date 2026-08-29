# AUTHZ-AUDIT-001

| Campo | Valor |
| --- | --- |
| Document ID | Requisitos de auditoria de autorização |
| Prompt | 08 |

## Separação de trilhas (Prompt 06 + SEC-REQ-024)

| Trilha | Conteúdo auth | Retenção |
| --- | --- | --- |
| SECURITY_AUDIT | Permissão negada, break-glass, exportação sensível, mudança alçada | TARGET_NOT_DEFINED |
| AUDIT_TRAIL | Ação empresarial autorizada executada | DOMAIN_HISTORY complementar |
| TECHNICAL_LOG | Erros, performance — **sem** substituir SECURITY_AUDIT | Infra |

## Eventos obrigatórios candidatos

| Evento | Dados mínimos |
| --- | --- |
| Autorização concedida (sensível) | Ator, papel candidato, ação, recurso id, timestamp |
| Autorização negada | DENY-id, ator, ação tentada, motivo categorizado |
| Elevação temporária | Mandato, aprovador, validade |
| Exportação sensível | AUTHZ-026, escopo, formato |
| Mudança ROLE-CAND | Quem alterou, de/para — ADP-010 |
| Acesso documento RESTRITO | Documento id, versão, ator |

## Ações CRITICAL (auditoria reforçada)

CMD-005, CMD-011, CMD-012, CMD-018, CMD-019, CMD-020, CMD-021, alteração preço, exportação.

## Não registrar como única prova

- VIEWED / ACKNOWLEDGED — podem ser AUDIT_ONLY (DE-006)
- Log de navegação UI sem ação empresarial

## Integridade

Audit trail empresarial: leitura restrita (ROLE-CAND-013 + auditoria futura); imutabilidade candidata — ADP-011.

## SEC-REQ mapeados

SEC-REQ-020, SEC-REQ-024, SEC-REQ-016.
