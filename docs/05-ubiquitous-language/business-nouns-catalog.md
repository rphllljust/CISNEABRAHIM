# UL-NOUN-CAT-001

| Campo       | Valor                                 |
| ----------- | ------------------------------------- |
| Document ID | Catálogo de substantivos empresariais |
| Fonte       | SRC-001                               |
| Prompt      | 04                                    |

| Substantivo (PT)          | Classe semântica          | TERM               | Evidência | Status                     | Notas                                                         |
| ------------------------- | ------------------------- | ------------------ | --------- | -------------------------- | ------------------------------------------------------------- |
| Cliente                   | BUSINESS_ENTITY           | TERM-004           | EV-047    | PENDING_BUSINESS_DECISION  | Cadastro e papel TBD                                          |
| Solicitante               | BUSINESS_ACTOR            | TERM-005           | EV-003    | ACCEPTED_FOR_DOCUMENTATION | ≠ cliente necessariamente                                     |
| Solicitação               | BUSINESS_ENTITY           | TERM-001           | EV-027    | ACCEPTED_FOR_DOCUMENTATION | ≠ OS                                                          |
| Pedido                    | BUSINESS_ENTITY           | TERM-012           | EV-055    | AMBIGUOUS                  | vs solicitação vs PO                                          |
| Proposta                  | BUSINESS_ENTITY           | TERM-011           | EV-055    | PENDING_BUSINESS_DECISION  | Encadeamento comercial                                        |
| Contrato                  | BUSINESS_ENTITY           | TERM-014           | EV-055    | PENDING_BUSINESS_DECISION  | Não detalhado na fonte                                        |
| Purchase Order (PO)       | EXTERNAL_IDENTIFIER       | TERM-013           | EV-059    | AMBIGUOUS                  | Cardinalidade DDP-009                                         |
| RC                        | UNKNOWN                   | —                  | —         | AMBIGUOUS                  | **Não evidenciado** em SRC-001; não registrar como definitivo |
| OS                        | BUSINESS_ENTITY           | TERM-002           | EV-028    | AMBIGUOUS                  | Tipos e estados DDP-001                                       |
| Item (OS / faturável)     | VALUE_CONCEPT             | TERM-040, TERM-041 | EV-065    | ACCEPTED_FOR_DOCUMENTATION | Qualificar sempre                                             |
| Recurso                   | BUSINESS_ENTITY           | TERM-029           | EV-050    | ACCEPTED_FOR_DOCUMENTATION | Operacional, não TI                                           |
| Mão de obra               | BUSINESS_ENTITY           | TERM-028           | EV-055    | AMBIGUOUS                  | Tipo vs pessoa DDP-006                                        |
| Pessoa executora          | BUSINESS_ROLE             | TERM-006           | EV-037    | PENDING_BUSINESS_DECISION  | ≠ responsável                                                 |
| Ajudante                  | BUSINESS_ROLE             | —                  | EV-054    | AMBIGUOUS                  | Taxonomia DDP-006                                             |
| Motorista                 | BUSINESS_ROLE             | —                  | EV-054    | AMBIGUOUS                  | Taxonomia DDP-006                                             |
| Operador                  | BUSINESS_ROLE             | —                  | EV-054    | AMBIGUOUS                  | Taxonomia DDP-006                                             |
| Equipamento               | BUSINESS_ENTITY           | TERM-025           | EV-050    | AMBIGUOUS                  | vs tipo vs veículo                                            |
| Ativo físico              | BUSINESS_ENTITY           | —                  | EV-050    | AMBIGUOUS                  | Candidato; não distinto de equipamento na fonte               |
| Máquina                   | BUSINESS_ENTITY           | TERM-027           | EV-049    | AMBIGUOUS                  | Locação vs serviço                                            |
| Veículo                   | BUSINESS_ENTITY           | TERM-026           | EV-050    | AMBIGUOUS                  | Frota própria/terceiro                                        |
| Alocação                  | DOMAIN_STATE / EVENT      | TERM-030           | EV-051    | ACCEPTED_FOR_DOCUMENTATION | Ver state-event-command-semantics                             |
| Disponibilidade (recurso) | DOMAIN_STATE              | —                  | EV-053    | AMBIGUOUS                  | ≠ disponibilidade NFR do sistema                              |
| Realizado (quantidade)    | VALUE_CONCEPT             | TERM-024           | EV-065    | ACCEPTED_FOR_DOCUMENTATION | ACTUAL candidato                                              |
| Evidência                 | DOCUMENT                  | TERM-034, TERM-035 | EV-069    | ACCEPTED_FOR_DOCUMENTATION | ≠ EV-* do registro atômico                                    |
| Medição                   | BUSINESS_ENTITY / PROCESS | TERM-016           | EV-062    | AMBIGUOUS                  | Entidade vs fase DDP-010                                      |
| Faturamento               | BUSINESS_ENTITY / PROCESS | TERM-017           | EV-074    | AMBIGUOUS                  | Registro vs cobrança                                          |
| Nota                      | DOCUMENT                  | TERM-018           | EV-064    | AMBIGUOUS                  | Fiscal vs informado DDP-023                                   |
| Fatura                    | DOCUMENT                  | —                  | EV-064    | AMBIGUOUS                  | Homônimo de nota                                              |
| Pagamento                 | BUSINESS_ENTITY           | TERM-019           | EV-064    | PENDING_BUSINESS_DECISION  | SoT DDP-012                                                   |
| Documento                 | DOCUMENT                  | TERM-031           | EV-081    | ACCEPTED_FOR_DOCUMENTATION | Lógico, não arquivo                                           |
| Versão                    | VALUE_CONCEPT             | TERM-032           | EV-082    | ACCEPTED_FOR_DOCUMENTATION | Documental                                                    |
| Arquivo                   | DOCUMENT                  | TERM-033           | EV-069    | ACCEPTED_FOR_DOCUMENTATION | Binário associado                                             |
| Responsável               | BUSINESS_ROLE             | TERM-008           | EV-084    | ACCEPTED_FOR_DOCUMENTATION | Accountable pela OS                                           |
| Handoff                   | DOMAIN_EVENT              | —                  | EV-084    | AMBIGUOUS                  | Transferência de responsabilidade DDP-032                     |
| Aging                     | METRIC                    | TERM-039           | EV-075    | PENDING_BUSINESS_DECISION  | Faixas TBD DDP-024                                            |
| Custo                     | VALUE_CONCEPT             | TERM-020           | EV-059    | ACCEPTED_FOR_DOCUMENTATION | INTERNAL_COST                                                 |
| Preço                     | VALUE_CONCEPT             | TERM-021           | EV-059    | ACCEPTED_FOR_DOCUMENTATION | COMMERCIAL_PRICE                                              |
| Margem                    | VALUE_CONCEPT             | TERM-022           | EV-060    | PENDING_BUSINESS_DECISION  | Fórmula DDP-031                                               |
| Saldo (PO)                | VALUE_CONCEPT             | —                  | EV-060    | AMBIGUOUS                  | Consumo autorizado TBD                                        |
| Adicional                 | VALUE_CONCEPT             | —                  | EV-046    | ACCEPTED_FOR_DOCUMENTATION | FR-018; autorização candidata                                 |
| Serviço                   | VALUE_CONCEPT             | TERM-003           | EV-011    | AMBIGUOUS                  | Escopo amplo                                                  |
| Referência comercial      | EXTERNAL_IDENTIFIER       | TERM-015           | EV-058    | ACCEPTED_FOR_DOCUMENTATION | Integração ERP candidata                                      |
| Divergência comercial     | VALUE_CONCEPT             | TERM-042           | EV-056    | ACCEPTED_FOR_DOCUMENTATION | PO / contrato                                                 |
| Histórico                 | DOMAIN_EVENT / AUDIT      | TERM-044           | EV-078    | ACCEPTED_FOR_DOCUMENTATION | DOMAIN_HISTORY candidato                                      |

**Total substantivos analisados:** 44 (inclui RC como não evidenciado).

Normalizações críticas: [homonyms-and-collisions.md](./homonyms-and-collisions.md).
