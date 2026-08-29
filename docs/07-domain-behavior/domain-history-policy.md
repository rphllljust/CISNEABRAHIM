# DBEH-DH-POL-001

| Campo | Valor |
| --- | --- |
| Document ID | Política de histórico de domínio |
| Prompt | 06 |

## DOMAIN_HISTORY vs outros registros

| Aspecto | DOMAIN_HISTORY | AUDIT_TRAIL | DE (evento) |
| --- | --- | --- | --- |
| Propósito | Evolução consultável do negócio | Accountability de ações | Fato para integração interna |
| Exemplo | Status OS, histórico alterações FR-022 | Quem liberou, quando | ServiceOrderReleased |
| Mutabilidade | Append-only candidato (INV-014) | Append-only | Imutável após publicação |
| Consumidor | UI operacional, relatórios | Auditoria, disputas | Outros BCs |

## Eventos que alimentam DOMAIN_HISTORY

DE-001, DE-003, DE-004, DE-007, DE-009..DE-012, DE-014..DE-017, DE-019 — candidatos.

DE-006 (visualizada) — **opcional** em DOMAIN_HISTORY; preferência AUDIT_ONLY até DDP-032.

## O que não é DOMAIN_HISTORY

- TECHNICAL_LOG
- Tentativas de comando rejeitadas (REJ) — podem ir AUDIT_TRAIL ou SECURITY_AUDIT
- Projeções de relatório (BC-016)

Retenção: DDP-019 — sem prazo inventado.
