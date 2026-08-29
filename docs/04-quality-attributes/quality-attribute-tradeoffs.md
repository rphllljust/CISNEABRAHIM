# QATTR-TRADEOFF-001

| Campo | Valor |
| --- | --- |
| Document ID | Trade-offs de atributos de qualidade |
| Fonte | SRC-001 |
| Prompt | 03 |

> Nenhum vencedor escolhido sem decisão empresarial registrada.

## Matriz de conflitos

| Trade-off | Polo A | Polo B | Contexto | DDP / decisão | Status |
| --- | --- | --- | --- | --- | --- |
| TO-001 | Segurança (autorização, SoD) | Usabilidade (agilidade operacional) | Liberação rápida vs controle | DDP-003, DDP-022 | OPEN |
| TO-002 | Consistência forte | Disponibilidade | Integração síncrona com ERP | DDP-014, DDP-020 | OPEN |
| TO-003 | Auditoria completa | Privacidade / minimização | Logs e histórico com PII | DDP-039, DDP-019 | OPEN |
| TO-004 | Retenção longa | Minimização de dados | Documentos e histórico | DDP-019 | OPEN |
| TO-005 | Rastreabilidade total | Custo de armazenamento | Histórico OS, versões documentais | DDP-019 | OPEN |
| TO-006 | Performance (relatórios) | Validação rigorosa | Consultas pesadas vs regras em tempo real | DDP-036 | OPEN |
| TO-007 | Flexibilidade operacional | Integridade financeira | Adicionais em campo vs autorização prévia | DDP-004, AUTH-REQ-019 | OPEN |
| TO-008 | Operação offline | Consistência central | DDP-018 | DDP-018 | OPEN |
| TO-009 | Integração síncrona | Resiliência | Falha externa vs latência | DDP-014 | OPEN |
| TO-010 | Notificação ativa (WhatsApp) | Registro mínimo de evento | CAPABILITY_ONLY vs EVENT_MUST_BE_RECORDED | DDP-021 | OPEN |

## Notas

- Trade-offs não resolvidos bloqueiam targets numéricos e algumas implementações.
- Resolução exige fonte primária e decisão em `domain-decisions-pending.md`.
