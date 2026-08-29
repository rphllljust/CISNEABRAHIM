# DBEH-DE-REG-001

| Campo | Valor |
| --- | --- |
| Document ID | Registro de eventos de domínio |
| Total | 20 (DE-001..DE-020) |
| Prompt | 06 |

> Eventos = fatos **passados** relevantes. Nome no passado.

| ID | Nome (passado) | Classificação | Produtor | CMD | Status |
| --- | --- | --- | --- | --- | --- |
| DE-001 | Solicitação registrada | DOMAIN_HISTORY_EVENT | BC-005 | CMD-001 | CANDIDATE |
| DE-002 | Solicitação decidida | DOMAIN_HISTORY_EVENT | BC-005 | CMD-002 | PENDING |
| DE-003 | OS criada a partir de solicitação | DOMAIN_HISTORY_EVENT | BC-006 | CMD-003 | CANDIDATE |
| DE-004 | OS liberada | DOMAIN_HISTORY_EVENT | BC-006 | CMD-005 | CANDIDATE |
| DE-005 | Responsável atribuído | DOMAIN_HISTORY_EVENT | BC-006 | CMD-006 | AMBIGUOUS |
| DE-006 | OS visualizada | AUDIT_ONLY | BC-006 | — | CANDIDATE |
| DE-007 | Recurso alocado | DOMAIN_HISTORY_EVENT | BC-007 | CMD-015 | CANDIDATE |
| DE-008 | Conflito de alocação detectado | DOMAIN_HISTORY_EVENT | BC-007 | — | CANDIDATE |
| DE-009 | Execução iniciada | DOMAIN_HISTORY_EVENT | BC-008 | CMD-008 | CANDIDATE |
| DE-010 | Quantidade realizada registrada | DOMAIN_HISTORY_EVENT | BC-008 | CMD-009 | CANDIDATE |
| DE-011 | OS concluída | DOMAIN_HISTORY_EVENT | BC-008 | CMD-010 | CANDIDATE |
| DE-012 | OS cancelada | DOMAIN_HISTORY_EVENT | BC-006 | CMD-011 | CANDIDATE |
| DE-013 | Evidência anexada | DOMAIN_HISTORY_EVENT | BC-009 | CMD-016 | CANDIDATE |
| DE-014 | Medição submetida | DOMAIN_HISTORY_EVENT | BC-010 | CMD-017 | CANDIDATE |
| DE-015 | Medição decidida | DOMAIN_HISTORY_EVENT | BC-010 | CMD-018 | PENDING |
| DE-016 | Faturamento preparado | DOMAIN_HISTORY_EVENT | BC-011 | CMD-019 | CANDIDATE |
| DE-017 | Documento de faturamento registrado | DOMAIN_HISTORY_EVENT | BC-012 | CMD-020 | CANDIDATE |
| DE-018 | Pagamento registrado | DOMAIN_HISTORY_EVENT | BC-013 | CMD-021 | PENDING |
| DE-019 | Versão documental substituída | DOMAIN_HISTORY_EVENT | BC-014 | CMD-022 | CANDIDATE |
| DE-020 | Referência comercial sincronizada | INTEGRATION_EVENT_CANDIDATE | BC-018 | — | CANDIDATE |

---

## DE-004 — OS liberada (detalhe)

| Campo | Valor |
| --- | --- |
| Significado | Ato empresarial de liberação concluído |
| Comando causador | CMD-005 |
| Invariantes satisfeitas | INV-002 |
| Dados mínimos | OS id; timestamp liberação; autorizador candidato |
| Consumidores candidatos | BC-008, BC-015, BC-017, BC-016 |
| Efeito interno | Estado OS → liberada (candidato Prompt 07) |
| Efeito externo | Nenhum confirmado |
| Histórico | DOMAIN_HISTORY + AUDIT_TRAIL |
| Notificação | NOTIFICATION_TRIGGER_CANDIDATE |
| Ordenação | Após DE-003; antes DE-009 |
| Duplicidade | Rejeitar segundo DE-004 equivalente (INV-002) |
| Versão semântica futura | v1 candidata |
| Status | CANDIDATE |

## DE-006 — OS visualizada

| Campo | Valor |
| --- | --- |
| Classificação | **AUDIT_ONLY** — pode ser timestamp, não estado obrigatório |
| Significado | Responsável visualizou OS |
| Notas | VIEWED ≠ ACKNOWLEDGED (DDP-032); REJECTED_AS_DOMAIN_EVENT se promover a estado sem decisão |
| Status | CANDIDATE |

Eventos `NOT_SUPPORTED` do Prompt 01 permanecem sem DE até DDP: ServiceOrderReopened, etc.
