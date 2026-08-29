# DBND-WF-001

| Campo | Valor |
| --- | --- |
| Document ID | Fluxos transversais entre contextos |
| Prompt | 05 |

## WF-001 — Solicitação → OS

| Campo | Valor |
| --- | --- |
| Produtor | BC-CAND-005 Service Request |
| Consumidor | BC-CAND-006 Service Order |
| Informação | Identificador solicitação; dados intake; decisão |
| Autoridade | Write solicitação: BC-005; write OS: BC-006 |
| Consistência | STRONG_TRANSACTIONAL na conversão (NFR-003) |
| Falha | Conversão parcial → sem OS órfã; idempotência |
| Repetição | IDEMPOTENCY_REQUIRED (NFR-003) |
| Reconciliação | Consulta solicitação vs OS vinculada |
| Decisão pendente | DDP-002 — toda solicitação gera OS? |

## WF-002 — OS → Execução

| Campo | Valor |
| --- | --- |
| Produtor | BC-CAND-006 |
| Consumidor | BC-CAND-008 Field Execution |
| Informação | OS liberada; itens; responsável |
| Autoridade | Estado liberado: BC-006; progresso real: BC-008 |
| Consistência | STRONG_WITHIN_BOUNDARY |
| Falha | Execução sem liberação → bloquear (FR-017) |
| Repetição | SAFE_REPEAT leitura; UNIQUE início/conclusão |
| Reconciliação | Estado OS vs execução |
| Decisão pendente | DDP-003 — critérios liberação |

## WF-003 — Execução → Medição

| Campo | Valor |
| --- | --- |
| Produtor | BC-CAND-008 |
| Consumidor | BC-CAND-010 Measurement |
| Informação | Quantidade realizada; elegibilidade item |
| Autoridade | Realizado: BC-008; medição: BC-010 |
| Consistência | STRONG_WITHIN_BOUNDARY |
| Falha | Medição sem execução → rejeitar (FR-035) |
| Repetição | NFR-013 idempotência submissão |
| Reconciliação | Medição vs quantidades OS |
| Decisão pendente | DBND-004 — medição entidade vs fase |

## WF-004 — Medição → Faturamento

| Campo | Valor |
| --- | --- |
| Produtor | BC-CAND-010 |
| Consumidor | BC-CAND-011 Billing Preparation |
| Informação | Medição aprovada; itens faturáveis |
| Autoridade | Decisão medição: BC-010; preparação: BC-011 |
| Consistência | STRONG_TRANSACTIONAL candidato |
| Falha | Faturar sem origem → bloquear (FR-038) |
| Repetição | FINANCIAL_RACE (NFR-011) |
| Reconciliação | Itens faturados vs medição |
| Decisão pendente | DDP-011 |

## WF-005 — Faturamento → Nota

| Campo | Valor |
| --- | --- |
| Produtor | BC-CAND-011 |
| Consumidor | BC-CAND-012 Invoice & Receivables |
| Informação | Origem itens; valores candidatos |
| Autoridade | Preparação: BC-011; registro nota: BC-012 |
| Consistência | STRONG_WITHIN_BOUNDARY |
| Falha | Nota duplicada → idempotência |
| Repetição | NFR-011 |
| Reconciliação | Nota vs preparação |
| Decisão pendente | DDP-023 — fiscal vs informado |

## WF-006 — Nota → Pagamento

| Campo | Valor |
| --- | --- |
| Produtor | BC-CAND-012 ou **sistema externo** |
| Consumidor | BC-CAND-013 Payment Tracking |
| Informação | Identificador nota; valor; status pagamento |
| Autoridade | **SoT pendente** — DDP-012 |
| Consistência | EVENTUAL_ACCEPTABLE se réplica |
| Falha | Pagamento sem nota → política TBD |
| Repetição | IDEMPOTENCY_REQUIRED |
| Reconciliação | Conciliação financeira externa |
| Decisão pendente | DDP-012 |

## WF-007 — OS → Recursos (paralelo)

| Campo | Valor |
| --- | --- |
| Produtor | BC-CAND-006 / BC-CAND-007 |
| Consumidor | BC-CAND-007 / BC-CAND-008 |
| Informação | Plano e alocação |
| Autoridade | Alocação: BC-007 |
| Consistência | EXCLUSIVE_RESOURCE (NFR-005) |
| Falha | Conflito alocação → detectar (FR-028) |
| Decisão pendente | DDP-007 |

## WF-008 — Evidência → Documento

| Campo | Valor |
| --- | --- |
| Produtor | BC-CAND-009 |
| Consumidor | BC-CAND-014 |
| Informação | Metadados evidência; arquivo |
| Autoridade | Evidência: BC-009; arquivo: BC-014 |
| Consistência | STRONG_WITHIN_BOUNDARY |
| Decisão pendente | DDP-013 |

Todos os fluxos publicam fatos candidatos para BC-CAND-017 Audit quando aplicável.
