# DBEH-INV-REG-001

| Campo | Valor |
| --- | --- |
| Document ID | Registro de invariantes |
| Total | 22 (INV-001..INV-022) |
| CONFIRMED | **0** |
| Prompt | 06 |

## Índice

| ID | Declaração resumida | BC | Criticidade | Status |
| --- | --- | --- | --- | --- |
| INV-001 | Uma conversão efetiva por solicitação | BC-005/006 | CRITICAL | CANDIDATE |
| INV-002 | OS não liberada sem autorização e elegibilidade | BC-006 | CRITICAL | CANDIDATE |
| INV-003 | Solicitação não duplicada por reenvio | BC-005 | HIGH | CANDIDATE |
| INV-004 | Recurso não duplamente alocado (exclusivo) | BC-007 | HIGH | CANDIDATE |
| INV-005 | Custo interno ≠ preço comercial (conceito) | BC-003 | HIGH | CANDIDATE |
| INV-006 | Custo/margem visíveis só a autorizados | BC-003 | HIGH | PENDING_BUSINESS_DECISION |
| INV-007 | Item faturável com origem identificável | BC-011 | CRITICAL | CANDIDATE |
| INV-008 | Medição referencia execução elegível | BC-010 | HIGH | PENDING_SOURCE_VALIDATION |
| INV-009 | Medição não duplicada sem decisão | BC-010 | HIGH | CANDIDATE |
| INV-010 | Pagamento não duplicado | BC-013 | CRITICAL | PENDING_BUSINESS_DECISION |
| INV-011 | Nota/faturamento não duplicado | BC-012 | CRITICAL | CANDIDATE |
| INV-012 | PO: consumo não excede saldo silenciosamente | BC-004 | HIGH | PENDING_BUSINESS_DECISION |
| INV-013 | Versão documental anterior preservada | BC-014 | HIGH | CANDIDATE |
| INV-014 | Histórico OS append-only empresarial | BC-017/006 | HIGH | CANDIDATE |
| INV-015 | Cancelamento ⊥ conclusão | BC-006/008 | HIGH | CANDIDATE |
| INV-016 | Integração não produz sucesso local falso | BC-018 | HIGH | CANDIDATE |
| INV-017 | SoD: decisor medição ≠ preparador | BC-010 | HIGH | PENDING_BUSINESS_DECISION |
| INV-018 | Sistema não emite NF-e | BC-012 | MEDIUM | CANDIDATE |
| INV-019 | Alteração OS sem lost update silencioso | BC-006 | HIGH | CANDIDATE |
| INV-020 | Execução exige OS liberada | BC-008 | HIGH | CANDIDATE |
| INV-021 | Quantidade realizada rastreável à execução | BC-008 | MEDIUM | CANDIDATE |
| INV-022 | Identificador externo comercial imutável silencioso | BC-003/018 | MEDIUM | CANDIDATE |

---

## INV-001 — Uma conversão efetiva por solicitação

| Campo | Valor |
| --- | --- |
| Declaração normativa | Uma solicitação de serviço não deverá originar mais de uma OS efetiva sem decisão explícita registrada. |
| Contexto | BC-CAND-005 → BC-CAND-006; conversão |
| Fontes / EV | SRC-001; EV-028, EV-036 |
| BR / FR / UC | BR-001; FR-008, FR-009; UC-005 |
| Condição protegida | Estado pós-conversão da solicitação |
| Momento de avaliação | Antes e após comando Converter |
| Consequência violação | REJ-001; reconciliação manual |
| Boundary candidata | STRONG_TRANSACTIONAL (conversão) |
| Proteção backend futura | Verificação idempotência + vínculo 1:1 candidato |
| Proteção banco futura | Unicidade candidata em vínculo solicitação→OS |
| Autorização | Autorizador empresarial candidato (DDP-002) |
| Concorrência | DEDUPLICATION_REQUIRED |
| Idempotência | UNIQUE_BUSINESS_OPERATION |
| Efeito financeiro | Indireto — evita OS duplicadas |
| Criticidade | CRITICAL |
| Exemplo válido | Uma OS vinculada à solicitação X |
| Contraexemplo | Duas OS ativas da mesma solicitação |
| DDPs | DDP-002 |
| Status | CANDIDATE |

## INV-002 — OS não liberada sem autorização e elegibilidade

| Campo | Valor |
| --- | --- |
| Declaração normativa | OS não deverá ser liberada para execução sem elegibilidade empresarial candidata e ato de autorização registrado. |
| Contexto | BC-CAND-006; liberação |
| Fontes / EV | EV-039, EV-013, EV-036 |
| BR / FR / UC | BR-006; FR-014; UC-008 |
| Condição protegida | Transição para liberada |
| Momento de avaliação | Comando Liberar OS |
| Consequência violação | REJ-002, REJ-003 |
| Boundary | STRONG_WITHIN_BOUNDARY |
| Proteção backend | PRED-001 + autorização |
| Proteção banco | Estado + trilha autorização candidata |
| Autorização | SEC-REQ-003; Autorizador empresarial |
| Concorrência | EXCLUSIVE_RESOURCE |
| Idempotência | UNIQUE_BUSINESS_OPERATION |
| Efeito financeiro | Alto — habilita execução e medição |
| Criticidade | CRITICAL |
| DDPs | DDP-003, DDP-029 |
| Status | CANDIDATE |

## INV-003 — Solicitação não duplicada por reenvio

| Campo | Valor |
| --- | --- |
| Declaração normativa | Reenvio da mesma intenção de registro não deverá criar solicitação duplicada não autorizada. |
| Contexto | BC-CAND-005 |
| Fontes / EV | EV-027, EV-005 |
| BR / FR | BR-004; FR-001; NFR-002 |
| Momento | Registrar solicitação |
| Consequência | REJ-004 ou retorno da existente |
| Boundary | STRONG_WITHIN_BOUNDARY |
| Idempotência | IDEMPOTENCY_REQUIRED |
| DDPs | DDP-002 |
| Status | CANDIDATE |

## INV-004 — Recurso não duplamente alocado

| Campo | Valor |
| --- | --- |
| Declaração normativa | Mesmo recurso operacional não deverá estar alocado de forma exclusiva a duas OS/itens concorrentes sem política explícita. |
| Contexto | BC-CAND-007 |
| Fontes / EV | EV-053, EV-051 |
| BR / FR | BR-017; FR-025, FR-028; NFR-005 |
| Momento | Alocar recurso |
| Consequência | REJ-005 |
| Boundary | STRONG_WITHIN_BOUNDARY |
| Concorrência | EXCLUSIVE_RESOURCE |
| DDPs | DDP-007 |
| Status | CANDIDATE |

## INV-005 — Custo interno distinto de preço comercial

| Campo | Valor |
| --- | --- |
| Declaração normativa | Custo interno e preço comercial deverão permanecer conceitualmente distintos em qualquer representação. |
| Contexto | BC-CAND-003 |
| Fontes / EV | EV-059, EV-061 |
| BR / FR | BR-018; FR-031, FR-032; TERM-020, TERM-021 |
| Consequência | REJ-006 se mistura |
| Efeito financeiro | Integridade de margem |
| DDPs | DDP-031 |
| Status | CANDIDATE |

## INV-007 — Item faturável com origem identificável

| Campo | Valor |
| --- | --- |
| Declaração normativa | Item faturável não deverá ser registrado sem origem empresarial identificável (medição, OS, contrato candidato). |
| Contexto | BC-CAND-011 |
| Fontes / EV | EV-017, EV-058 |
| BR / FR | BR-014; FR-038; TERM-041 |
| Momento | Preparar faturamento |
| Consequência | REJ-007 |
| Boundary | STRONG_TRANSACTIONAL candidato |
| NFR | NFR-011 |
| DDPs | DDP-011 |
| Status | CANDIDATE |

## INV-009 — Medição não duplicada

| Campo | Valor |
| --- | --- |
| Declaração normativa | Submissão de medição não deverá duplicar medição equivalente para o mesmo escopo sem decisão. |
| Contexto | BC-CAND-010 |
| Fontes / EV | EV-062 |
| FR | FR-036; NFR-013 |
| Consequência | REJ-008 |
| Idempotência | IDEMPOTENCY_REQUIRED |
| DDPs | DDP-010 |
| Status | CANDIDATE |

## INV-010 — Pagamento não duplicado

| Campo | Valor |
| --- | --- |
| Declaração normativa | Registro de pagamento não deverá duplicar efeito financeiro para mesma obrigação sem decisão. |
| Contexto | BC-CAND-013 |
| Fontes / EV | EV-066 |
| Consequência | REJ-009 |
| SoT | DDP-012 — pendente |
| Idempotência | IDEMPOTENCY_REQUIRED |
| Status | PENDING_BUSINESS_DECISION |

## INV-011 — Nota não duplicada

| Campo | Valor |
| --- | --- |
| Declaração normativa | Registro de documento de faturamento informado não deverá duplicar cobrança para mesma origem. |
| Contexto | BC-CAND-012 |
| Fontes / EV | EV-064, EV-065 |
| FR | FR-039; NFR-011 |
| Consequência | REJ-010 |
| Status | CANDIDATE |

## INV-012 — Saldo PO não excedido silenciosamente

| Campo | Valor |
| --- | --- |
| Declaração normativa | Consumo de PO não deverá exceder saldo autorizado sem registro explícito de divergência ou bloqueio. |
| Contexto | BC-CAND-004 |
| Fontes / EV | EV-060 |
| FR | FR-033, FR-034 |
| Consequência | REJ-011 |
| DDPs | DDP-009 |
| Status | PENDING_BUSINESS_DECISION |

## INV-013 — Versão documental preservada

| Campo | Valor |
| --- | --- |
| Declaração normativa | Substituição documental deverá preservar versão anterior consultável. |
| Contexto | BC-CAND-014 |
| Fontes / EV | EV-082 |
| BR / FR | BR-016; FR-042; NFR-009 |
| Consequência | REJ-012 |
| Status | CANDIDATE |

## INV-014 — Histórico OS append-only

| Campo | Valor |
| --- | --- |
| Declaração normativa | Histórico empresarial da OS não deverá ser apagado ou sobrescrito silenciosamente. |
| Contexto | BC-CAND-017, BC-CAND-006 |
| Fontes / EV | EV-078, EV-079 |
| BR / FR | BR-023; FR-022; NFR-006 |
| Status | CANDIDATE |

## INV-016 — Integração sem sucesso falso

| Campo | Valor |
| --- | --- |
| Declaração normativa | Falha de integração externa não deverá registrar sucesso local de sincronização. |
| Contexto | BC-CAND-018 |
| BR / NFR | BR-005; NFR-012 |
| Consequência | REJ-013 |
| Status | CANDIDATE |

> INV-006, INV-008, INV-015, INV-017..022: campos completos alinhados ao índice; detalhes em [financial-integrity-rules.md](./financial-integrity-rules.md), [resource-exclusivity-rules.md](./resource-exclusivity-rules.md).

Nenhum INV com status `CONFIRMED`.
