# Lacunas de fonte e pedidos

| Campo       | Valor                                    |
| ----------- | ---------------------------------------- |
| Document ID | SGAR-001                                 |
| Prioridade  | P0 = bloqueante · P1 = alto · P2 = médio |

## Pedidos priorizados

| Prioridade | Artefato solicitado                                                                    | Motivo                             | DDP / RISK relacionados    |
| ---------- | -------------------------------------------------------------------------------------- | ---------------------------------- | -------------------------- |
| P0         | Confirmação formal da direção sobre escopo do primeiro release e prioridade de locação | EV-080, EV-082                     | DDP-026, RISK-021          |
| P0         | Transcrições originais das conversas com patrocinador                                  | Validar SRC-001 reconstruído       | RISK-017                   |
| P0         | Documento Mestre ou equivalente empresarial                                            | Substituir consolidação preliminar | RISK-017                   |
| P1         | Exemplos reais de Purchase Order (anonimizados)                                        | Cardinalidade, saldo, campos       | DDP-009, RISK-009          |
| P1         | Fluxo atual documentado ou workshop com operação                                       | Confirmar as-is                    | DDP-002, DDP-003           |
| P1         | Matriz de quem cria/libera/aprova OS                                                   | Segregação                         | DDP-022, DDP-015, RISK-022 |
| P1         | Política ou decisão sobre canal WhatsApp                                               | Canal oficial vs registro          | DDP-021, DDP-033, RISK-018 |
| P1         | Responsável fiscal/contábil — modo de emissão de nota                                  | EV-065                             | DDP-023, RISK-012          |
| P2         | Documentação ERP atual                                                                 | SoT e integração                   | DDP-014, DDP-020, RISK-010 |
| P2         | Exemplos de medição e faturamento                                                      | Processo §14                       | DDP-010, DDP-011           |
| P2         | Requisitos de retenção legal/empresarial                                               | §22                                | DDP-019                    |
| P2         | Volumes, usuários simultâneos, RPO/RTO                                                 | §22                                | DDP-017, DDP-016           |
| P2         | Requisito PWA / offline em campo                                                       | §22                                | DDP-025, DDP-018           |
| P2         | Cadastro de frota — campos obrigatórios (chassi, etc.)                                 | §8                                 | DDP-034, DDP-027           |

## Fontes NOT_PROVIDED (registro existente)

Ver [../01-foundation/source-registry.md](../01-foundation/source-registry.md) — lista mantida; SRC-001 não a substitui.

## Critério de encerramento de lacuna

Cada pedido exige: artefato depositado em `docs/inputs/`, novo ou atualizado `SRC-NNN`, e nova rodada de análise atômica.

## Dependências do Prompt 02 (2026-08-28)

O Prompt 02 derivou 42 FRs, 26 UCs e 52 ACs exclusivamente de SRC-001. As lacunas abaixo **bloqueiam validação** dos requisitos (não a existência dos registros candidatos):

| Lacuna                              | Impacto em requisitos                  | Artefatos afetados                                |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------- |
| Fontes primárias ausentes           | Nenhum FR/BR pode ser `CONFIRMED`      | Todos em `03-requirements/`                       |
| Transcrições originais              | Validação de EV e FR de solicitação/OS | FR-001..FR-014, UC-001..UC-008                    |
| Matriz criar/liberar OS             | AUTH-REQ-004..006, FR-014              | `authorization-requirements.md`                   |
| Decisão WhatsApp (DDP-021, DDP-033) | FR-002 `CAPABILITY_ONLY`               | `notification-requirements.md`, INT-REQ-004       |
| Modo fiscal (DDP-023)               | FR-039 sem emissão fiscal presumida    | FR-039, UC-023, RQ-QUESTION fiscal                |
| Source of Truth ERP (DDP-014)       | INT-REQ-001, FR-039 pagamento          | `integration-requirements.md`                     |
| Escopo primeiro release (DDP-026)   | CAP-* `first release UNKNOWN`          | `business-capability-map.md`, RQ-QUESTION direção |
| Faixas de aging (DDP-024)           | RPT-REQ sem bandas inventadas          | `reporting-requirements.md`, BR-022               |

Revalidação exigida após ingestão de fonte primária: atualizar `requirements-traceability.md`, `provenance-matrix.md` e `requirements-coverage.md`.
